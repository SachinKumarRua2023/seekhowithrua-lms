// mobile/src/pages/MnemonicSystem.tsx
// Memory palace / mnemonic learning system

import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator,
} from "react-native";
import { COLORS, SPACING, RADIUS, FONTS } from "../constants/theme";

const GROQ_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || "";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

interface MnemonicCard {
  concept:   string;
  mnemonic:  string;
  story:     string;
  palace_cue: string;
}

export default function MnemonicSystem() {
  const [concept,  setConcept]  = useState("");
  const [cards,    setCards]    = useState<MnemonicCard[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const generate = async () => {
    if (!concept.trim()) { setError("Enter a concept to memorize"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(GROQ_URL, {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${GROQ_KEY}`,
        },
        body: JSON.stringify({
          model:      "llama-3.3-70b-versatile",
          max_tokens: 600,
          messages: [{
            role:    "user",
            content: `Create a mnemonic system for memorizing: "${concept.trim()}"
            
Return ONLY valid JSON (no markdown, no backticks) in this exact format:
{
  "concept": "the concept",
  "mnemonic": "acronym or rhyme",
  "story": "vivid memorable story",
  "palace_cue": "memory palace location and image"
}`,
          }],
        }),
      });
      const data = await res.json();
      const raw  = data.choices?.[0]?.message?.content || "{}";
      const clean = raw.replace(/```json|```/g, "").trim();
      const card  = JSON.parse(clean) as MnemonicCard;
      setCards((prev) => [card, ...prev]);
      setConcept("");
    } catch {
      setError("Could not generate mnemonic. Check your API key.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🧠 Mnemonic System</Text>
        <Text style={styles.headerSub}>AI-powered memory palace builder</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Input */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>WHAT DO YOU WANT TO MEMORIZE?</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. The 7 chakras, Pythagorean theorem, Django REST framework..."
            placeholderTextColor={COLORS.muted}
            value={concept}
            onChangeText={(v) => { setConcept(v); setError(""); }}
            multiline
          />
          {!!error && <Text style={styles.errorText}>⚠️ {error}</Text>}
          <TouchableOpacity
            style={[styles.btn, loading && { opacity: 0.6 }]}
            onPress={generate}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={COLORS.bg} />
              : <Text style={styles.btnText}>🧠 Generate Mnemonic</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Cards */}
        {cards.map((card, i) => (
          <View key={i} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardConcept}>{card.concept}</Text>
              <View style={styles.newBadge}><Text style={styles.newBadgeText}>NEW</Text></View>
            </View>

            <Section icon="🔤" label="MNEMONIC" color={COLORS.cyan}>
              <Text style={[styles.sectionValue, { color: COLORS.primary, fontSize: FONTS.sizes.lg, letterSpacing: 2 }]}>
                {card.mnemonic}
              </Text>
            </Section>

            <Section icon="📖" label="STORY" color={COLORS.violet}>
              <Text style={styles.sectionText}>{card.story}</Text>
            </Section>

            <Section icon="🏛️" label="MEMORY PALACE" color={COLORS.gold}>
              <Text style={styles.sectionText}>{card.palace_cue}</Text>
            </Section>
          </View>
        ))}

        {cards.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🧠</Text>
            <Text style={styles.emptyTitle}>Your memory palace awaits</Text>
            <Text style={styles.emptyText}>Enter any concept above to generate a powerful mnemonic system</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function Section({ icon, label, color, children }: { icon: string; label: string; color: string; children: React.ReactNode }) {
  return (
    <View style={[secStyles.container, { borderLeftColor: color }]}>
      <Text style={secStyles.label}><Text>{icon} </Text>{label}</Text>
      {children}
    </View>
  );
}

const secStyles = StyleSheet.create({
  container: { borderLeftWidth: 2, paddingLeft: SPACING.md, marginBottom: SPACING.md },
  label:     { color: "#888", fontSize: FONTS.sizes.xs, fontFamily: "monospace", letterSpacing: 1.5, marginBottom: SPACING.xs },
});

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.background },
  header:       { padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle:  { fontSize: FONTS.sizes.xl, fontWeight: "700", color: COLORS.textPrimary },
  headerSub:    { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, marginTop: 4 },

  content:      { padding: SPACING.lg, paddingBottom: 40 },
  inputCard:    { backgroundColor: COLORS.surfaceAlt, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.lg, marginBottom: SPACING.lg },
  inputLabel:   { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, fontFamily: "monospace", letterSpacing: 2, marginBottom: SPACING.sm },
  input:        { backgroundColor: "rgba(0,0,0,0.45)", borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: SPACING.md, color: COLORS.textPrimary, fontSize: FONTS.sizes.md, minHeight: 70, marginBottom: SPACING.sm },
  errorText:    { color: COLORS.error, fontSize: FONTS.sizes.sm, marginBottom: SPACING.sm },
  btn:          { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: "center" },
  btnText:      { color: COLORS.textPrimary, fontWeight: "700", fontSize: FONTS.sizes.md },

  card:         { backgroundColor: COLORS.surfaceAlt, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.lg, marginBottom: SPACING.md },
  cardHeader:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.lg },
  cardConcept:  { flex: 1, color: COLORS.textPrimary, fontSize: FONTS.sizes.lg, fontWeight: "700" },
  newBadge:     { backgroundColor: "rgba(0,255,136,0.1)", borderRadius: RADIUS.full, paddingHorizontal: SPACING.sm, paddingVertical: 3, borderWidth: 1, borderColor: "rgba(0,255,136,0.3)" },
  newBadgeText: { color: COLORS.success, fontSize: FONTS.sizes.xs, fontFamily: "monospace" },
  sectionValue: { fontFamily: "monospace" },
  sectionText:  { color: COLORS.textPrimary, fontSize: FONTS.sizes.sm, lineHeight: 20 },

  emptyState:   { alignItems: "center", paddingVertical: 60 },
  emptyEmoji:   { fontSize: 64, marginBottom: SPACING.md },
  emptyTitle:   { fontSize: FONTS.sizes.lg, fontWeight: "700", color: COLORS.textPrimary, marginBottom: SPACING.sm },
  emptyText:    { color: COLORS.textMuted, textAlign: "center" },
});