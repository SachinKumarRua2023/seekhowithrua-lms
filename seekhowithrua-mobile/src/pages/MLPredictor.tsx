// mobile/src/pages/MLPredictor.tsx
// YouTube Growth Predictor — React Native port
// Replaces: frontend MLPredictor.jsx

import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator,
} from "react-native";
import api from "../services/api";
import { COLORS, SPACING, RADIUS, FONTS } from "../constants/theme";

interface Channel {
  channel_name: string;
  subscribers:  number;
  video_views:  number;
  uploads:      number;
}
interface Result {
  predicted_subscribers: number;
  predicted_video_views: number;
  similar_channels?: Channel[];
}

const fmt = (n?: number) => (n ? Number(n).toLocaleString() : "0");

export default function MLPredictor() {
  const [form,    setForm]    = useState({ subscribers: "", views: "", uploads: "" });
  const [result,  setResult]  = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!form.subscribers || !form.views || !form.uploads) {
      setError("Please fill all fields."); return;
    }
    try {
      setLoading(true);
      const res = await api.post("/api/ml/recommend/", {
        subscribers: Number(form.subscribers),
        views:       Number(form.views),
        uploads:     Number(form.uploads),
      });
      setResult(res.data);
    } catch {
      setError("Failed to connect to backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🚀 YouTube Growth Predictor</Text>
        <Text style={styles.headerSub}>AI-powered channel analytics and prediction</Text>
      </View>

      {/* Input Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📊 Channel Metrics</Text>

        {[
          { key: "subscribers", label: "Current Subscribers",  ph: "e.g. 10000" },
          { key: "views",       label: "Total Video Views",    ph: "e.g. 500000" },
          { key: "uploads",     label: "Total Uploads",        ph: "e.g. 50" },
        ].map((f) => (
          <View key={f.key} style={styles.formGroup}>
            <Text style={styles.label}>{f.label}</Text>
            <TextInput
              style={styles.input}
              placeholder={f.ph}
              placeholderTextColor={COLORS.muted}
              keyboardType="numeric"
              value={form[f.key as keyof typeof form]}
              onChangeText={(v) => setForm((p) => ({ ...p, [f.key]: v }))}
            />
          </View>
        ))}

        {!!error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.btn, loading && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading
            ? <ActivityIndicator color={COLORS.bg} />
            : <Text style={styles.btnText}>🔮 Predict Growth</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Results */}
      {result && (
        <>
          <View style={styles.predRow}>
            <PredCard icon="📈" label="Predicted Subscribers" value={fmt(result.predicted_subscribers)} color={COLORS.cyan} />
            <PredCard icon="📺" label="Predicted Views"       value={fmt(result.predicted_video_views)} color={COLORS.violet} />
          </View>

          {result.similar_channels && result.similar_channels.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>🔥 Top Similar Channels</Text>
              {result.similar_channels.map((ch, i) => (
                <View key={i} style={styles.channelCard}>
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>#{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.channelName}>{ch.channel_name}</Text>
                    <View style={styles.statsRow}>
                      <Stat label="Subscribers" value={fmt(ch.subscribers)} />
                      <Stat label="Views"        value={fmt(ch.video_views)} />
                      <Stat label="Uploads"      value={fmt(ch.uploads)} />
                    </View>
                  </View>
                </View>
              ))}
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

function PredCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <View style={[styles.predCard, { borderColor: color + "50" }]}>
      <Text style={styles.predIcon}>{icon}</Text>
      <Text style={[styles.predValue, { color }]}>{value}</Text>
      <Text style={styles.predLabel}>{label}</Text>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.background },
  content:      { padding: SPACING.lg, paddingBottom: 40 },
  header:       { marginBottom: SPACING.lg },
  headerTitle:  { fontSize: FONTS.sizes.xl, fontWeight: "700", color: COLORS.textPrimary },
  headerSub:    { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, marginTop: 4 },

  card:         { backgroundColor: COLORS.surfaceAlt, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.lg, marginBottom: SPACING.lg },
  cardTitle:    { color: COLORS.primary, fontSize: FONTS.sizes.md, fontWeight: "700", marginBottom: SPACING.md },
  formGroup:    { marginBottom: SPACING.md },
  label:        { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, fontWeight: "600", marginBottom: SPACING.xs, letterSpacing: 1, fontFamily: "monospace" },
  input:        { backgroundColor: "rgba(0,0,0,0.45)", borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: SPACING.md, color: COLORS.textPrimary, fontSize: FONTS.sizes.md },
  errorBox:     { backgroundColor: "rgba(255,45,120,0.1)", borderRadius: RADIUS.sm, padding: SPACING.sm, marginBottom: SPACING.sm, borderWidth: 1, borderColor: "rgba(255,45,120,0.3)" },
  errorText:    { color: COLORS.error, fontSize: FONTS.sizes.sm },
  btn:          { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: "center", marginTop: SPACING.sm },
  btnText:      { color: COLORS.background, fontWeight: "700", fontSize: FONTS.sizes.md },

  predRow:      { flexDirection: "row", gap: SPACING.md, marginBottom: SPACING.lg },
  predCard:     { flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, borderWidth: 1, padding: SPACING.md, alignItems: "center" },
  predIcon:     { fontSize: 28, marginBottom: SPACING.xs },
  predValue:    { fontSize: FONTS.sizes.xl, fontWeight: "800", fontFamily: "monospace" },
  predLabel:    { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, textAlign: "center", marginTop: SPACING.xs },

  sectionTitle: { color: COLORS.textPrimary, fontSize: FONTS.sizes.lg, fontWeight: "700", marginBottom: SPACING.md },
  channelCard:  { flexDirection: "row", backgroundColor: COLORS.surfaceAlt, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.sm, gap: SPACING.md, alignItems: "center" },
  rankBadge:    { width: 32, height: 32, borderRadius: RADIUS.full, backgroundColor: "rgba(0,245,255,0.1)", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "rgba(0,245,255,0.3)" },
  rankText:     { color: COLORS.primary, fontWeight: "700", fontSize: FONTS.sizes.sm },
  channelName:  { color: COLORS.textPrimary, fontWeight: "700", fontSize: FONTS.sizes.md, marginBottom: SPACING.xs },
  statsRow:     { flexDirection: "row", gap: SPACING.md, flexWrap: "wrap" },
  statLabel:    { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  statValue:    { color: COLORS.primary, fontWeight: "700", fontSize: FONTS.sizes.sm },
});