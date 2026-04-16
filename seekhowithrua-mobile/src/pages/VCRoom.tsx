// mobile/src/pages/VCRoom.tsx
// ╔══════════════════════════════════════════════════════════════════╗
// ║  SEEKHO VC ROOM — Advanced Edition                              ║
// ║  • Solana SPL token earning (SEEKHO token)                      ║
// ║  • AI Speaker (Claude + ElevenLabs TTS + Whisper STT)          ║
// ║  • Auth via app.seekhowithrua.com → deep link → app           ║
// ║  • Categories: Tech | Philosophy | Spiritual | Business         ║
// ╚══════════════════════════════════════════════════════════════════╝

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert, Animated, Vibration, Platform, Linking,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import api, { blockchainAPI, vcrAPI } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { RootStackParamList } from "../navigation/AppNavigator";
import { COLORS, FONTS, SPACING, RADIUS } from "../constants/theme";

// WebRTC imports - fully optional
let RTCPeerConnection: any = null;
let mediaDevices: any = null;
try {
  const webrtc = require("react-native-webrtc");
  RTCPeerConnection = webrtc.RTCPeerConnection;
  mediaDevices = webrtc.mediaDevices;
} catch { /* WebRTC not available */ }

// ─── Types ───────────────────────────────────────────────────────────────────
type NavProp = NativeStackNavigationProp<RootStackParamList>;
type RouteRef = RouteProp<RootStackParamList, "VCRoom">;
type PanelCategory = "tech" | "philosophy" | "spiritual" | "business";

interface Participant {
  id: string;
  backendId: number;
  name: string;
  role: "host" | "cohost" | "speaker" | "listener" | "ai";
  muted: boolean;
  handRaised: boolean;
  peerId?: string;
  isAI?: boolean;
  tokensEarned?: number;
}

interface ChatMessage {
  id: string | number;
  from: { id: number | string; name: string };
  text: string;
  time: string;
  mine: boolean;
  isAI?: boolean;
}

interface Room {
  id: number | string;
  title: string;
  desc: string;
  hostName: string;
  memberCount: number;
  isActive: boolean;
  category: PanelCategory;
  tokenPool: number;
}

interface TokenBalance {
  seekho: number;
  solanaAddress?: string;
  pendingWithdraw: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const MAX_SPEAKERS = 3;
const AI_JOIN_DELAY_MS = 60_000;
const TOKEN_PER_SPEAKER_MINUTE = 2;
const TOKEN_PER_HOST_MINUTE = 5;
const TOKEN_PER_UPVOTE = 10;
const CATEGORY_BONUS: Record<PanelCategory, number> = {
  tech: 1.5, philosophy: 1.2, spiritual: 1.2, business: 1.3,
};
const CATEGORY_META: Record<PanelCategory, { icon: string; color: string; label: string }> = {
  tech: { icon: "⚡", color: "#00d4ff", label: "Tech" },
  philosophy: { icon: "🧠", color: "#a78bfa", label: "Philosophy" },
  spiritual: { icon: "🕉️", color: "#fbbf24", label: "Spiritual" },
  business: { icon: "📈", color: "#34d399", label: "Business" },
};
const ROLE_COLORS = {
  host: "#ffd700", cohost: "#00d4aa", speaker: "#8b5cf6", listener: "#475569", ai: "#00d4ff",
};
const AI_SPEAKER_ID = "ai-speaker-seekho";
const AI_SPEAKER_NAME = "Seekho AI";

function timeStr() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Component
export default function VCRoom() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteRef>();
  const { user } = useAuth();
  const panelId = route.params?.panelId;

  // State
  const [screen, setScreen] = useState<"rooms" | "panel">("rooms");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [panelTitle, setPanelTitle] = useState("");
  const [panelDesc, setPanelDesc] = useState("");
  const [createBusy, setCreateBusy] = useState(false);
  const [panelInfo, setPanelInfo] = useState<any>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sidebarTab, setSidebarTab] = useState<"chat" | "people" | "host">("chat");
  const [myRole, setMyRole] = useState<"host" | "cohost" | "speaker" | "listener">("listener");
  const [muted, setMuted] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [connected, setConnected] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [boostRankLoading, setBoostRankLoading] = useState(false);

  // Refs
  const panelRef = useRef<any>(null);
  const myRoleRef = useRef(myRole);
  const _participantsRef = useRef(participants);
  const wsRef = useRef<any>(null);
  const localStreamRef = useRef<any>(null);
  const chatScrollRef = useRef<ScrollView>(null);

  useEffect(() => { _participantsRef.current = participants; }, [participants]);
  useEffect(() => { myRoleRef.current = myRole; }, [myRole]);

  useEffect(() => {
    setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  const push = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  }, []);

  // Load panels
  const loadPanels = useCallback(async () => {
    if (!user) return;
    setRoomsLoading(true);
    try {
      const res = await api.get("/api/panels/");
      const data = res.data;
      if (Array.isArray(data)) {
        setRooms(data.map((p: any) => ({
          id: p.id,
          title: p.title || p.name || "Untitled Panel",
          desc: p.description || p.desc || "",
          hostName: p.host_username || p.host_name || "",
          memberCount: p.member_count || 0,
          isActive: p.is_active !== false,
          category: (p.category || "tech") as PanelCategory,
          tokenPool: p.token_pool || 0,
        })));
      }
    } catch (e) {
      push("Could not load panels");
    } finally {
      setRoomsLoading(false);
    }
  }, [user]);

  useEffect(() => { loadPanels(); }, [loadPanels]);

  useEffect(() => {
    if (panelId && user) {
      joinPanelById(panelId);
    }
  }, [panelId, user]);

  // WebSocket
  function connectWS(panelId: string | number) {
    const wsUrl = `${process.env.EXPO_PUBLIC_WS_URL || "wss://api.seekhowithrua.com/ws"}/panels/${panelId}/`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      push("Connected to panel");
    };

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        handleWsMessage(data);
      } catch {}
    };

    ws.onclose = () => setConnected(false);
    ws.onerror = () => push("Connection error");
  }

  function sendWS(data: any) {
    if (wsRef.current?.readyState === 1) { // WebSocket.OPEN = 1
      wsRef.current.send(JSON.stringify(data));
    }
  }

  function handleWsMessage(data: any) {
    switch (data.type) {
      case "participants_update":
        setParticipants(data.participants || []);
        break;
      case "chat":
        setMessages((m) => [...m, {
          id: Date.now() + Math.random(),
          from: data.from,
          text: data.text,
          time: data.time,
          mine: data.from?.id === user?.id,
        }]);
        break;
      case "raise_hand":
        push(`${data.from?.name || "Someone"} raised their hand`);
        setParticipants((prev) =>
          prev.map((p) => String(p.id) === String(data.from?.id) ? { ...p, handRaised: true } : p)
        );
        break;
      case "lower_hand":
        setParticipants((prev) =>
          prev.map((p) => String(p.id) === String(data.from?.id) ? { ...p, handRaised: false } : p)
        );
        break;
      case "speak_approved":
        if (String(data.user_id) === String(user?.id)) {
          setMyRole("speaker");
          setHandRaised(false);
          push("You're on stage! Mic is live.");
          startMic();
        }
        break;
      case "force_mute":
        if (String(data.user_id) === String(user?.id)) {
          muteLocalStream();
          setMuted(true);
          push("Muted by host");
        }
        break;
      case "kick":
        if (String(data.user_id) === String(user?.id)) {
          push("You were removed from the panel");
          cleanup();
          setScreen("rooms");
        }
        break;
      case "room_ended":
        push("Host ended this panel");
        cleanup();
        setScreen("rooms");
        break;
    }
  }

  // Audio
  async function startMic() {
    if (localStreamRef.current) return localStreamRef.current;
    if (!mediaDevices) {
      push("WebRTC not available");
      return null;
    }
    try {
      const stream = await mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      return stream;
    } catch {
      push("Mic access denied");
      return null;
    }
  }

  function muteLocalStream() {
    localStreamRef.current?.getAudioTracks().forEach((t: any) => { t.enabled = false; });
  }

  // Create panel
  async function handleCreatePanel() {
    if (!panelTitle.trim()) { push("Enter a panel title"); return; }
    setCreateBusy(true);
    try {
      const res = await api.post("/api/panels/create/", {
        title: panelTitle.trim(),
        description: panelDesc.trim(),
        topic: "general",
        max_members: 20,
      });
      const panel = res.data;
      panelRef.current = panel;
      setPanelInfo({ ...panel, title: panelTitle.trim(), hostName: user?.first_name || user?.email });
      setParticipants([{
        id: String(user!.id),
        backendId: user!.id,
        name: user?.first_name || user?.email || "Host",
        role: "host",
        muted: false,
        handRaised: false,
      }]);
      setMyRole("host");
      setShowCreate(false);
      setPanelTitle("");
      setPanelDesc("");
      setScreen("panel");
      connectWS(panel.id);
      await startMic();
      push("Panel live!");
    } catch (err: any) {
      push(err.response?.data?.error || "Could not create panel");
    } finally {
      setCreateBusy(false);
    }
  }

  // Join panel
  async function joinPanelById(panelId: string | number) {
    try {
      const res = await api.post(`/api/panels/${panelId}/join/`);
      const joinData = res.data;
      panelRef.current = { id: panelId, ...joinData };
      setPanelInfo({ id: panelId, title: joinData.title || "Live Panel", hostName: joinData.host_name || "" });
      setMyRole("listener");
      setScreen("panel");
      connectWS(panelId);
      push("Joined as listener");
    } catch (err: any) {
      push(err.response?.data?.error || "Could not join panel");
    }
  }

  // Chat
  function sendChat() {
    if (!chatInput.trim()) return;
    const msg = {
      type: "chat",
      from: { id: user!.id, name: user?.first_name || user?.email || "User" },
      text: chatInput.trim(),
      time: timeStr(),
    };
    sendWS(msg);
    setMessages((m) => [...m, { ...msg, id: Date.now(), mine: true }]);
    setChatInput("");
  }

  // Controls
  function toggleMute() {
    const nowMuted = !muted;
    localStreamRef.current?.getAudioTracks().forEach((t: any) => { t.enabled = !nowMuted; });
    setMuted(nowMuted);
    sendWS({ type: "mute_status", muted: nowMuted, user_id: user?.id });
  }

  async function toggleHand() {
    const newVal = !handRaised;
    setHandRaised(newVal);
    try {
      await api.post(`/api/panels/${panelRef.current?.id}/${newVal ? "raise-hand" : "lower-hand"}/`);
    } catch {}
    sendWS({
      type: newVal ? "raise_hand" : "lower_hand",
      from: { id: user!.id, name: user?.first_name || user?.email },
    });
  }

  // Host actions
  async function approveHandRaise(p: Participant) {
    if (participants.filter((x) => x.role === "speaker").length >= MAX_SPEAKERS) {
      push(`Max ${MAX_SPEAKERS} speakers allowed`);
      return;
    }
    try {
      await api.post(`/api/panels/${panelRef.current?.id}/promote/${p.backendId}/`);
    } catch {}
    sendWS({ type: "speak_approved", user_id: p.backendId });
    setParticipants((prev) =>
      prev.map((x) => x.id === p.id ? { ...x, role: "speaker", handRaised: false } : x)
    );
    push(`${p.name} is on stage`);
  }

  async function kickParticipant(p: Participant) {
    Alert.alert("Remove Member", `Remove ${p.name} from panel?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove", style: "destructive",
        onPress: async () => {
          try {
            await api.post(`/api/panels/${panelRef.current?.id}/kick/${p.backendId}/`);
          } catch {}
          sendWS({ type: "kick", user_id: p.backendId });
          setParticipants((prev) => prev.filter((x) => x.id !== p.id));
        },
      },
    ]);
  }

  // Boost Rank
  async function handleBoostRank() {
    if (!panelRef.current?.id) return;
    setBoostRankLoading(true);
    try {
      await api.post(`/api/vcr/rooms/${panelRef.current.id}/boost_rank/`);
      push("Rank boosted! You're now prioritized to speak.");
      sendWS({
        type: "boost_rank",
        from: { id: user!.id, name: user?.first_name || user?.email },
      });
    } catch (err: any) {
      push(err.response?.data?.error || "Failed to boost rank");
    } finally {
      setBoostRankLoading(false);
    }
  }

  // End / Leave
  async function endPanel() {
    Alert.alert("End Panel", "End this panel for everyone?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "End", style: "destructive",
        onPress: async () => {
          sendWS({ type: "room_ended" });
          try { await api.post(`/api/panels/${panelRef.current?.id}/leave/`); } catch {}
          cleanup();
          setScreen("rooms");
          loadPanels();
        },
      },
    ]);
  }

  async function leavePanel() {
    try { await api.post(`/api/panels/${panelRef.current?.id}/leave/`); } catch {}
    cleanup();
    setScreen("rooms");
    loadPanels();
  }

  function cleanup() {
    wsRef.current?.close();
    wsRef.current = null;
    localStreamRef.current?.getTracks().forEach((t: any) => t.stop());
    localStreamRef.current = null;
    setPanelInfo(null);
    setParticipants([]);
    setMessages([]);
    setMyRole("listener");
    setConnected(false);
    setMuted(false);
    setHandRaised(false);
  }

  // Derived
  const stageParticipants = useMemo(() => participants.filter((p) => ["host", "cohost", "speaker"].includes(p.role)), [participants]);
  const audienceParticipants = useMemo(() => participants.filter((p) => p.role === "listener"), [participants]);
  const isController = myRole === "host" || myRole === "cohost";
  const isTrainer = user?.profile?.role === "trainer" || user?.role === "trainer";

  // Avatar Orb Component
  function AvatarOrb({ p, isMe, isController: ctrl, onKick }: {
    p: Participant; isMe: boolean; isController: boolean; onKick: () => void;
  }) {
    const roleColor = ROLE_COLORS[p.role] || ROLE_COLORS.listener;
    return (
      <View style={orbStyles.wrap}>
        <View style={[orbStyles.orb, { borderColor: roleColor }]}>
          <Text style={[orbStyles.initial, { color: roleColor }]}>
            {(p.name || "?")[0].toUpperCase()}
          </Text>
          {p.handRaised && <View style={orbStyles.handBadge}><Text style={{ fontSize: 10 }}>✋</Text></View>}
        </View>
        <Text style={orbStyles.name} numberOfLines={1}>
          {isMe ? `${p.name} (you)` : p.name}
        </Text>
        {ctrl && !isMe && p.role !== "host" && (
          <TouchableOpacity style={orbStyles.kickBtn} onPress={onKick}>
            <Text style={{ color: "#ff2d78", fontSize: 10 }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Render: Rooms List
  if (screen === "rooms") {
    return (
      <View style={styles.container}>
        {!!notification && (
          <View style={styles.toast}>
            <Text style={styles.toastText}>{notification}</Text>
          </View>
        )}

        {showCreate && (
          <View style={styles.modalOverlay}>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>CREATE PANEL</Text>
              <TextInput
                style={styles.input}
                placeholder="Panel title"
                placeholderTextColor={COLORS.textMuted}
                value={panelTitle}
                onChangeText={setPanelTitle}
              />
              <TextInput
                style={styles.input}
                placeholder="Description (optional)"
                placeholderTextColor={COLORS.textMuted}
                value={panelDesc}
                onChangeText={setPanelDesc}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={() => setShowCreate(false)}>
                  <Text style={styles.btnGhostText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, styles.btnPrimary, { flex: 2 }, createBusy && { opacity: 0.6 }]}
                  onPress={handleCreatePanel}
                  disabled={createBusy}
                >
                  {createBusy ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnPrimaryText}>Launch Panel</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        <ScrollView contentContainerStyle={styles.roomsContent}>
          <View style={styles.roomsHeader}>
            <View>
              <Text style={styles.roomsTitle}>LIVE PANELS</Text>
              <Text style={styles.roomsSubtitle}>
                {user?.first_name || user?.email} · {isTrainer ? "Trainer" : "Seeker"}
              </Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={[styles.btn, styles.btnGhost, styles.btnSm]} onPress={loadPanels}>
                <Text style={styles.btnGhostText}>↻</Text>
              </TouchableOpacity>
              {isTrainer && (
                <TouchableOpacity style={[styles.btn, styles.btnPrimary, styles.btnSm]} onPress={() => setShowCreate(true)}>
                  <Text style={styles.btnPrimaryText}>+ New</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {roomsLoading ? (
            <View style={styles.loadingCenter}>
              <ActivityIndicator color={COLORS.primary} size="large" />
            </View>
          ) : rooms.filter((r) => r.isActive).length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🌌</Text>
              <Text style={styles.emptyTitle}>The void is quiet</Text>
              <Text style={styles.emptyText}>
                {isTrainer ? "Create the first panel." : "No panels live right now."}
              </Text>
            </View>
          ) : (
            rooms.filter((r) => r.isActive).map((room) => (
              <TouchableOpacity key={room.id} style={styles.roomCard} onPress={() => joinPanelById(room.id)}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.roomCardTitle}>{room.title}</Text>
                  {!!room.desc && <Text style={styles.roomCardDesc}>{room.desc}</Text>}
                  <View style={styles.roomCardMeta}>
                    <View style={styles.liveBadge}><Text style={styles.liveBadgeText}>● LIVE</Text></View>
                    <Text style={styles.metaText}>⭐ {room.hostName}</Text>
                    <Text style={styles.metaText}>👥 {room.memberCount}</Text>
                  </View>
                </View>
                <TouchableOpacity style={[styles.btn, styles.btnCyan, styles.btnSm]} onPress={() => joinPanelById(room.id)}>
                  <Text style={styles.btnCyanText}>Enter →</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    );
  }

  // Render: Panel
  return (
    <View style={styles.container}>
      {!!notification && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{notification}</Text>
        </View>
      )}

      <View style={styles.panelHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.panelTitle} numberOfLines={1}>{panelInfo?.title || "Live Panel"}</Text>
          <Text style={styles.panelSubtitle}>{participants.length} in space</Text>
        </View>
        <View style={styles.panelHeaderActions}>
          <View style={[styles.statusPill, connected && styles.statusPillConnected]}>
            <Text style={styles.statusText}>{connected ? "● LIVE" : "● CONNECTING"}</Text>
          </View>
          {myRole === "host" ? (
            <TouchableOpacity style={[styles.btn, styles.btnRose, styles.btnSm]} onPress={endPanel}>
              <Text style={styles.btnRoseText}>⛔ End</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.btn, styles.btnGhost, styles.btnSm]} onPress={leavePanel}>
              <Text style={styles.btnGhostText}>← Leave</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.sidebarTabs}>
        {(["chat", "people", ...(myRole === "host" ? ["host"] : [])] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.sidebarTab, sidebarTab === tab && styles.sidebarTabActive]}
            onPress={() => setSidebarTab(tab as any)}
          >
            <Text style={[styles.sidebarTabText, sidebarTab === tab && styles.sidebarTabTextActive]}>
              {tab.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ flex: 1 }}>
        {sidebarTab === "chat" && (
          <View style={{ flex: 1 }}>
            <ScrollView
              ref={chatScrollRef}
              style={styles.chatScroll}
              contentContainerStyle={{ padding: SPACING.md, paddingBottom: 8 }}
            >
              {messages.length === 0 && <Text style={styles.emptyChatText}>The conversation begins here...</Text>}
              {messages.map((m) => (
                <View key={m.id} style={[styles.chatMsg, m.mine && styles.chatMsgMine]}>
                  {!m.mine && <Text style={styles.chatMsgName}>{m.from.name}</Text>}
                  <View style={[styles.chatBubble, m.mine && styles.chatBubbleMine]}>
                    <Text style={styles.chatText}>{m.text}</Text>
                  </View>
                  <Text style={styles.chatTime}>{m.time}</Text>
                </View>
              ))}
            </ScrollView>
            <View style={styles.chatInputRow}>
              <TextInput
                style={styles.chatInput}
                placeholder="Say something..."
                placeholderTextColor={COLORS.textMuted}
                value={chatInput}
                onChangeText={setChatInput}
                onSubmitEditing={sendChat}
                returnKeyType="send"
              />
              <TouchableOpacity style={styles.sendBtn} onPress={sendChat}>
                <Text style={{ color: "#fff", fontWeight: "700" }}>→</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {sidebarTab === "people" && (
          <ScrollView contentContainerStyle={{ padding: SPACING.md }}>
            <Text style={styles.sectionLabel}>ON STAGE ({stageParticipants.length})</Text>
            <View style={styles.avatarGrid}>
              {stageParticipants.map((p) => (
                <AvatarOrb key={p.id} p={p} isMe={String(p.id) === String(user?.id)} isController={isController} onKick={() => kickParticipant(p)} />
              ))}
            </View>
            <Text style={[styles.sectionLabel, { marginTop: SPACING.md }]}>AUDIENCE ({audienceParticipants.length})</Text>
            {audienceParticipants.map((p) => (
              <View key={p.id} style={[styles.audienceChip, p.handRaised && styles.audienceChipRaised]}>
                <View style={styles.chipAvatar}>
                  <Text style={styles.chipAvatarText}>{(p.name || "?")[0].toUpperCase()}</Text>
                </View>
                <Text style={styles.chipName}>{String(p.id) === String(user?.id) ? `${p.name} (you)` : p.name}</Text>
                {p.handRaised && <Text>✋</Text>}
                {isController && String(p.id) !== String(user?.id) && (
                  <View style={styles.chipActions}>
                    {p.handRaised && (
                      <TouchableOpacity style={[styles.iconBtn, styles.iconBtnGold]} onPress={() => approveHandRaise(p)}>
                        <Text style={{ color: "#ffd700", fontSize: 12 }}>⬆</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={[styles.iconBtn, styles.iconBtnRose]} onPress={() => kickParticipant(p)}>
                      <Text style={{ color: "#ff2d78", fontSize: 12 }}>✕</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        )}

        {sidebarTab === "host" && myRole === "host" && (
          <ScrollView contentContainerStyle={{ padding: SPACING.md }}>
            <Text style={styles.sectionLabel}>HAND RAISES ({participants.filter((p) => p.handRaised).length})</Text>
            {participants.filter((p) => p.handRaised).map((p) => (
              <View key={p.id} style={[styles.audienceChip, styles.audienceChipRaised]}>
                <View style={styles.chipAvatar}>
                  <Text style={styles.chipAvatarText}>{(p.name || "?")[0].toUpperCase()}</Text>
                </View>
                <Text style={styles.chipName}>{p.name}</Text>
                <View style={styles.chipActions}>
                  <TouchableOpacity style={[styles.iconBtn, styles.iconBtnGold]} onPress={() => approveHandRaise(p)}>
                    <Text style={{ color: "#ffd700", fontSize: 11 }}>⬆ Stage</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.iconBtn, styles.iconBtnRose]} onPress={() => kickParticipant(p)}>
                    <Text style={{ color: "#ff2d78", fontSize: 11 }}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {participants.filter((p) => p.handRaised).length === 0 && (
              <Text style={{ color: COLORS.textMuted, fontSize: FONTS.sizes.sm }}>No hands raised</Text>
            )}
            <View style={{ marginTop: SPACING.xl }}>
              <TouchableOpacity style={[styles.btn, styles.btnRose, { width: "100%" as any }]} onPress={endPanel}>
                <Text style={styles.btnRoseText}>⛔ End Panel for Everyone</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>

      <View style={styles.myControls}>
        <Text style={styles.myRoleLabel}>{myRole.toUpperCase()}</Text>
        {(myRole === "host" || myRole === "cohost" || myRole === "speaker") && (
          <TouchableOpacity style={[styles.btn, muted ? styles.btnRose : styles.btnCyan]} onPress={toggleMute}>
            <Text style={muted ? styles.btnRoseText : styles.btnCyanText}>{muted ? "🔇 Unmute" : "🎙️ Mute"}</Text>
          </TouchableOpacity>
        )}
        {myRole === "listener" && (
          <>
            <TouchableOpacity style={[styles.btn, handRaised ? styles.btnGold : styles.btnGhost]} onPress={toggleHand}>
              <Text style={handRaised ? { color: "#ffd700", fontWeight: "700" } : styles.btnGhostText}>
                {handRaised ? "✋ Lower Hand" : "✋ Raise Hand"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnBoost, boostRankLoading && { opacity: 0.6 }]}
              onPress={handleBoostRank}
              disabled={boostRankLoading}
            >
              <Text style={styles.btnBoostText}>
                {boostRankLoading ? "🚀 Boosting..." : "🚀 Boost Rank"}
              </Text>
            </TouchableOpacity>
          </>
        )}
        <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={() => setSidebarTab("chat")}>
          <Text style={styles.btnGhostText}>💬 Chat</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const orbStyles = StyleSheet.create({
  wrap: { alignItems: "center", width: 80, marginBottom: SPACING.sm },
  orb: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.surface, borderWidth: 2, justifyContent: "center", alignItems: "center", position: "relative" },
  initial: { fontSize: FONTS.sizes.xl, fontWeight: "900" },
  name: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 4, textAlign: "center", maxWidth: 72 },
  handBadge: { position: "absolute", top: -4, right: -4, backgroundColor: "#ffd700", borderRadius: 10, width: 20, height: 20, justifyContent: "center", alignItems: "center" },
  kickBtn: { marginTop: 4, backgroundColor: "rgba(255,45,120,0.15)", borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: "rgba(255,45,120,0.3)" },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  toast: { position: "absolute", top: 60, right: 16, left: 16, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.sm, borderWidth: 1, borderColor: COLORS.border, zIndex: 100 },
  toastText: { color: COLORS.textPrimary, fontSize: FONTS.sizes.sm, textAlign: "center" },

  // Rooms
  roomsContent: { padding: SPACING.lg, paddingBottom: 40 },
  roomsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: SPACING.lg },
  roomsTitle: { fontSize: FONTS.sizes.xl, fontWeight: "900", color: COLORS.primary },
  roomsSubtitle: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, marginTop: 4 },
  headerActions: { flexDirection: "row", gap: SPACING.sm },
  loadingCenter: { padding: 60, alignItems: "center" },
  emptyState: { alignItems: "center", padding: 60 },
  emptyIcon: { fontSize: 56, marginBottom: SPACING.md },
  emptyTitle: { fontSize: FONTS.sizes.lg, fontWeight: "700", color: COLORS.textPrimary, marginBottom: SPACING.sm },
  emptyText: { color: COLORS.textMuted, textAlign: "center" },
  roomCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.sm, flexDirection: "row", alignItems: "center", gap: SPACING.md },
  roomCardTitle: { fontSize: FONTS.sizes.md, fontWeight: "700", color: COLORS.textPrimary },
  roomCardDesc: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, marginTop: 2 },
  roomCardMeta: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.xs, alignItems: "center" },
  liveBadge: { backgroundColor: "rgba(255,45,120,0.2)", paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: RADIUS.full },
  liveBadgeText: { color: "#ff2d78", fontSize: FONTS.sizes.xs, fontWeight: "700" },
  metaText: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },

  // Modal
  modalOverlay: { position: "absolute", inset: 0, backgroundColor: "rgba(2,0,8,0.9)", justifyContent: "center", alignItems: "center", padding: SPACING.lg, zIndex: 50 },
  modal: { backgroundColor: COLORS.surfaceAlt, borderRadius: RADIUS.xl, padding: SPACING.xl, width: "100%", borderWidth: 1, borderColor: COLORS.border },
  modalTitle: { color: COLORS.primary, fontSize: FONTS.sizes.md, textAlign: "center", marginBottom: SPACING.lg },
  modalActions: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.md },
  input: { backgroundColor: "rgba(0,0,0,0.45)", borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: SPACING.md, color: COLORS.textPrimary, fontSize: FONTS.sizes.md, marginBottom: SPACING.sm },

  // Panel header
  panelHeader: { flexDirection: "row", alignItems: "center", padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.surface },
  panelTitle: { fontSize: FONTS.sizes.md, fontWeight: "700", color: COLORS.textPrimary },
  panelSubtitle: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, marginTop: 2 },
  panelHeaderActions: { flexDirection: "row", gap: SPACING.sm, alignItems: "center" },
  statusPill: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  statusPillConnected: { borderColor: COLORS.success },
  statusText: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },

  // Sidebar tabs
  sidebarTabs: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: COLORS.border },
  sidebarTab: { flex: 1, padding: SPACING.sm, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
  sidebarTabActive: { borderBottomColor: COLORS.primary },
  sidebarTabText: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  sidebarTabTextActive: { color: COLORS.primary },

  // Chat
  chatScroll: { flex: 1 },
  emptyChatText: { color: COLORS.textMuted, textAlign: "center", paddingVertical: SPACING.xl, fontSize: FONTS.sizes.sm },
  chatMsg: { marginBottom: SPACING.sm },
  chatMsgMine: { alignItems: "flex-end" },
  chatMsgName: { color: COLORS.secondary, fontSize: FONTS.sizes.xs, marginBottom: 3 },
  chatBubble: { backgroundColor: COLORS.surfaceAlt, borderRadius: RADIUS.md, borderTopLeftRadius: 3, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.sm, maxWidth: "85%" },
  chatBubbleMine: { backgroundColor: "rgba(102,0,255,0.18)", borderColor: COLORS.primary, borderTopRightRadius: 3, borderTopLeftRadius: RADIUS.md },
  chatText: { color: COLORS.textPrimary, fontSize: FONTS.sizes.md },
  chatTime: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, marginTop: 3 },
  chatInputRow: { flexDirection: "row", padding: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border, gap: SPACING.sm },
  chatInput: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: SPACING.sm, color: COLORS.textPrimary, fontSize: FONTS.sizes.md },
  sendBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, justifyContent: "center" },

  // Stage / Audience
  sectionLabel: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, marginBottom: SPACING.sm },
  avatarGrid: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm, marginBottom: SPACING.md },
  audienceChip: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.surfaceAlt, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.xs, paddingRight: SPACING.sm, gap: SPACING.xs, marginBottom: SPACING.xs },
  audienceChipRaised: { borderColor: "rgba(255,215,0,0.5)" },
  chipAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.surface, justifyContent: "center", alignItems: "center" },
  chipAvatarText: { color: COLORS.primary, fontWeight: "700", fontSize: FONTS.sizes.xs },
  chipName: { flex: 1, color: COLORS.textMuted, fontSize: FONTS.sizes.sm },
  chipActions: { flexDirection: "row", gap: SPACING.xs },
  iconBtn: { borderRadius: RADIUS.sm, paddingHorizontal: 6, paddingVertical: 4, borderWidth: 1 },
  iconBtnGold: { backgroundColor: "rgba(255,215,0,0.1)", borderColor: "rgba(255,215,0,0.3)" },
  iconBtnRose: { backgroundColor: "rgba(255,45,120,0.1)", borderColor: "rgba(255,45,120,0.3)" },

  // My Controls
  myControls: { flexDirection: "row", gap: SPACING.sm, padding: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.surface, flexWrap: "wrap", alignItems: "center", justifyContent: "center" },
  myRoleLabel: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },

  // Buttons
  btn: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 },
  btnSm: { paddingHorizontal: SPACING.sm, paddingVertical: 6 },
  btnPrimary: { backgroundColor: COLORS.primary },
  btnPrimaryText: { color: "#fff", fontWeight: "700", fontSize: FONTS.sizes.sm },
  btnGhost: { backgroundColor: COLORS.surfaceAlt, borderWidth: 1, borderColor: COLORS.border },
  btnGhostText: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm },
  btnCyan: { backgroundColor: "rgba(0,68,102,0.8)", borderWidth: 1, borderColor: COLORS.border },
  btnCyanText: { color: COLORS.primary, fontSize: FONTS.sizes.sm, fontWeight: "700" },
  btnGold: { backgroundColor: "rgba(51,34,0,0.8)", borderWidth: 1, borderColor: "rgba(255,215,0,0.3)" },
  btnRose: { backgroundColor: "rgba(51,0,17,0.8)", borderWidth: 1, borderColor: "rgba(255,45,120,0.3)" },
  btnRoseText: { color: "#ff2d78", fontSize: FONTS.sizes.sm, fontWeight: "700" },
  btnBoost: { backgroundColor: "rgba(0,102,68,0.8)", borderWidth: 1, borderColor: "rgba(0,255,128,0.3)" },
  btnBoostText: { color: "#00ff80", fontSize: FONTS.sizes.sm, fontWeight: "700" },
});
