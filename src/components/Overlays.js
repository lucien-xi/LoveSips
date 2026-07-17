import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, Animated, Share } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, FONT } from '../theme';
import { useStore } from '../store';
import { StarIcon } from './icons';
import Confetti from './Confetti';

function HeartsToast({ amount, label }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(a, { toValue: 1, useNativeDriver: true, friction: 6, tension: 80 }).start();
  }, []);
  const translateY = a.interpolate({ inputRange: [0, 1], outputRange: [-30, 0] });
  return (
    <Animated.View style={{ opacity: a, transform: [{ translateY }], marginTop: 8 }}>
      <LinearGradient colors={['rgba(168,85,247,0.95)', 'rgba(236,72,153,0.95)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heartsToast}>
        {amount > 0 && <Text style={styles.heartsAmt}>+{amount} ❤️</Text>}
        <Text style={styles.heartsLabel} numberOfLines={1}>{label}</Text>
      </LinearGradient>
    </Animated.View>
  );
}

function BottomToast({ borderColor, title, msg }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.spring(a, { toValue: 1, useNativeDriver: true, friction: 6, tension: 70 }).start(); }, []);
  const translateY = a.interpolate({ inputRange: [0, 1], outputRange: [20, 0] });
  return (
    <Animated.View pointerEvents="none" style={[styles.bottomToast, { borderColor, opacity: a, transform: [{ translateX: -110 }, { translateY }] }]}>
      <Text style={styles.bottomToastTitle}>{title}</Text>
      <Text style={styles.bottomToastMsg}>{msg}</Text>
    </Animated.View>
  );
}

// Absolute overlay so popups layer above the shop overlay (mirrors the CSS z-index overlays).
function CenterOverlay({ visible, zIndex = 90, children }) {
  if (!visible) return null;
  return <View style={[StyleSheet.absoluteFill, { zIndex }]}>{children}</View>;
}

export default function Overlays() {
  const {
    reward, setReward, setVaultBadge, navRef,
    confirm, setConfirm,
    toasts, invToast, memoryToast,
    ticketPopup, setTicketPopup, activateGoldenTicket, s,
    redeem, setRedeem, confirmRedeemShare,
    mysteryReveal, setMysteryReveal,
    confettiKey,
  } = useStore();

  const doShare = async () => {
    const item = confirmRedeemShare();
    if (!item) return;
    const shareText = `💌 LoveSips Reward\n\nI've redeemed:\n${item.icon} ${item.title}\n\nDon't forget...\nYou owe me one. ❤️\n— Your Baby`;
    try { await Share.share({ message: shareText }); } catch (e) {}
  };

  return (
    <>
      {/* confetti */}
      {confettiKey > 0 && <Confetti key={confettiKey} />}

      {/* hearts toasts (top center stack) */}
      <View pointerEvents="none" style={styles.heartsStack}>
        {toasts.map((t) => <HeartsToast key={t.id} amount={t.amount} label={t.label} />)}
      </View>

      {/* inventory toast */}
      {invToast && (
        <BottomToast key={invToast.key} borderColor="rgba(168,85,247,0.4)" title={`${invToast.icon} ${invToast.title} added to Inventory`} msg={'"I\'ll collect this from you later ❤️"'} />
      )}
      {/* memory toast */}
      {memoryToast && (
        <BottomToast key={memoryToast.key} borderColor="rgba(0,229,255,0.4)" title="✨ Memory Added" msg={`You finally received your ${memoryToast.title}. Forever saved inside Love Memories. ❤️`} />
      )}

      {/* reward modal */}
      <CenterOverlay visible={!!reward} zIndex={90}>
        <Pressable style={styles.overlay} onPress={() => setReward(null)}>
          <Pressable style={styles.rewardCard} onPress={() => {}}>
            <Text style={styles.rewardTag}>{reward ? `${reward.milestone}% reached` : ''}</Text>
            <StarIcon size={38} color={C.purple} style={{ marginBottom: 18 }} />
            <Text style={styles.rewardH}>A New Star Lit Up</Text>
            <Text style={styles.rewardMsg}>"{reward?.note}"</Text>
            <Pressable style={{ width: '100%' }} onPress={() => { setReward(null); setVaultBadge(false); navRef.current && navRef.current('vault'); }}>
              <LinearGradient colors={[C.violet, C.cyan]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.rewardClose}>
                <Text style={styles.rewardCloseTxt}>Read his note</Text>
              </LinearGradient>
            </Pressable>
          </Pressable>
        </Pressable>
      </CenterOverlay>

      {/* confirm modal */}
      <CenterOverlay visible={!!confirm} zIndex={95}>
        <Pressable style={styles.overlay} onPress={() => setConfirm(null)}>
          <Pressable style={styles.confirmCard} onPress={() => {}}>
            <Text style={styles.confirmMsg}>{confirm?.message}</Text>
            <View style={styles.confirmBtns}>
              <Pressable style={[styles.confirmBtn, styles.confirmCancel]} onPress={() => setConfirm(null)}>
                <Text style={[styles.confirmBtnTxt, { color: C.textDim }]}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.confirmBtn, styles.confirmDanger]} onPress={() => { const cb = confirm?.onConfirm; setConfirm(null); cb && cb(); }}>
                <Text style={[styles.confirmBtnTxt, { color: C.red }]}>Yes, reset</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </CenterOverlay>

      {/* golden ticket popup */}
      <CenterOverlay visible={ticketPopup} zIndex={95}>
        <Pressable style={styles.overlay} onPress={() => setTicketPopup(false)}>
          <Pressable style={styles.ticketCard} onPress={() => {}}>
            <Text style={styles.ticketIconBig}>🎫</Text>
            <Text style={styles.ticketTitle}>Golden Ticket</Text>
            <View style={styles.ticketBadge}><Text style={styles.ticketBadgeTxt}>🎫 {s.goldenTickets} ticket</Text></View>
            <Text style={styles.ticketDesc}>Use your Golden Ticket to buy any one reward for free — every price becomes 1 🎫 while it's active.</Text>
            <Pressable style={{ width: '100%' }} onPress={activateGoldenTicket}>
              <LinearGradient colors={['#F59E0B', '#FCD34D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ticketUseBtn}>
                <Text style={styles.ticketUseTxt}>Use Golden Ticket 💛</Text>
              </LinearGradient>
            </Pressable>
            <Pressable style={styles.ticketCancel} onPress={() => setTicketPopup(false)}><Text style={styles.ticketCancelTxt}>Maybe later</Text></Pressable>
          </Pressable>
        </Pressable>
      </CenterOverlay>

      {/* redeem popup */}
      <CenterOverlay visible={!!redeem} zIndex={95}>
        <Pressable style={styles.overlay} onPress={() => setRedeem(null)}>
          <Pressable style={styles.confirmCard} onPress={() => {}}>
            <Text style={styles.redeemTag}>💌 Redeem Reward</Text>
            <Text style={styles.redeemSub}>You're about to redeem:</Text>
            <Text style={styles.redeemIcon}>{redeem?.item.icon}</Text>
            <Text style={styles.redeemTitle}>{redeem?.item.title}</Text>
            <Text style={styles.redeemHint}>After redeeming, share this with your man{'\n'}so he knows he owes you one.</Text>
            <View style={styles.redeemBtns}>
              <Pressable style={styles.redeemBtnWrap} onPress={doShare}>
                <LinearGradient colors={['#EC4899', '#A855F7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.redeemShareBtn}>
                  <Text style={styles.redeemShareTxt}>Share 💌</Text>
                </LinearGradient>
              </Pressable>
              <Pressable style={[styles.redeemCancelBtn, styles.confirmCancel]} onPress={() => setRedeem(null)}>
                <Text style={[styles.confirmBtnTxt, { color: C.textDim }]}>Cancel</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </CenterOverlay>

      {/* mystery reveal */}
      <CenterOverlay visible={!!mysteryReveal} zIndex={95}>
        <Pressable style={styles.overlay} onPress={() => setMysteryReveal(null)}>
          <Pressable style={styles.confirmCard} onPress={() => {}}>
            <Text style={styles.mysteryRevealTitle}>✨ Mystery Box</Text>
            <Text style={styles.mysteryRevealIcon}>{mysteryReveal?.icon}</Text>
            <Text style={styles.mysteryRevealName}>{mysteryReveal?.title}</Text>
            <Text style={styles.mysteryRevealDesc}>{mysteryReveal?.desc}</Text>
            <Pressable style={{ width: '100%', marginTop: 20 }} onPress={() => setMysteryReveal(null)}>
              <LinearGradient colors={[C.violet, C.cyan]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.mysteryRevealBtn}>
                <Text style={styles.mysteryRevealBtnTxt}>Lovely 💜</Text>
              </LinearGradient>
            </Pressable>
          </Pressable>
        </Pressable>
      </CenterOverlay>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', alignItems: 'center', justifyContent: 'center', padding: 26 },

  heartsStack: { position: 'absolute', top: 50, left: 0, right: 0, alignItems: 'center', zIndex: 150 },
  heartsToast: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 30, maxWidth: '88%' },
  heartsAmt: { fontFamily: FONT.bodyBold, fontSize: 13, color: '#fff' },
  heartsLabel: { fontSize: 11, color: '#fff', opacity: 0.92, flexShrink: 1 },

  bottomToast: { position: 'absolute', bottom: 120, left: '50%', width: 220, backgroundColor: 'rgba(16,20,26,0.98)', borderWidth: 1, borderRadius: 18, paddingHorizontal: 22, paddingVertical: 16, alignItems: 'center', zIndex: 160 },
  bottomToastTitle: { fontSize: 13, fontFamily: FONT.bodySemi, color: 'rgba(255,255,255,0.95)', marginBottom: 4, textAlign: 'center' },
  bottomToastMsg: { fontFamily: FONT.playfairItalic, fontSize: 12, color: C.purple, textAlign: 'center' },

  rewardCard: { width: '100%', maxWidth: 320, backgroundColor: '#12181F', borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)', borderRadius: 26, paddingHorizontal: 28, paddingTop: 36, paddingBottom: 30, alignItems: 'center' },
  rewardTag: { fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: C.cyan, fontFamily: FONT.bodySemi, marginBottom: 16 },
  rewardH: { fontFamily: FONT.playfairItalic, fontSize: 22, color: '#fff', marginBottom: 14, textAlign: 'center' },
  rewardMsg: { fontFamily: FONT.playfairItalic, fontSize: 15, lineHeight: 24, color: 'rgba(255,255,255,0.85)', textAlign: 'center' },
  rewardClose: { marginTop: 26, width: '100%', paddingVertical: 14, borderRadius: 30, alignItems: 'center' },
  rewardCloseTxt: { color: '#fff', fontSize: 11, letterSpacing: 1.6, textTransform: 'uppercase', fontFamily: FONT.bodySemi },

  confirmCard: { width: '100%', maxWidth: 300, backgroundColor: '#12181F', borderWidth: 1, borderColor: C.glassBorder, borderRadius: 22, paddingHorizontal: 22, paddingVertical: 26, alignItems: 'center' },
  confirmMsg: { fontSize: 13.5, lineHeight: 21, color: 'rgba(255,255,255,0.9)', textAlign: 'center', fontFamily: FONT.body },
  confirmBtns: { flexDirection: 'row', gap: 10, marginTop: 20, width: '100%' },
  confirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: C.glassBorder },
  confirmCancel: { backgroundColor: 'rgba(255,255,255,0.04)' },
  confirmDanger: { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.3)' },
  confirmBtnTxt: { fontSize: 12, fontFamily: FONT.bodySemi },

  ticketCard: { width: '100%', maxWidth: 310, backgroundColor: '#171100', borderWidth: 1, borderColor: 'rgba(251,191,36,0.5)', borderRadius: 24, paddingHorizontal: 24, paddingVertical: 32, alignItems: 'center' },
  ticketIconBig: { fontSize: 52, marginBottom: 14 },
  ticketTitle: { fontFamily: FONT.playfairItalic, fontSize: 21, color: C.gold, marginBottom: 8 },
  ticketBadge: { backgroundColor: 'rgba(251,191,36,0.12)', borderWidth: 1, borderColor: 'rgba(251,191,36,0.35)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginBottom: 20 },
  ticketBadgeTxt: { color: C.gold, fontFamily: FONT.bodyBold, fontSize: 14 },
  ticketDesc: { fontSize: 12.5, color: 'rgba(255,255,255,0.75)', lineHeight: 20, marginBottom: 22, textAlign: 'center' },
  ticketUseBtn: { width: '100%', paddingVertical: 14, borderRadius: 24, alignItems: 'center', marginBottom: 10 },
  ticketUseTxt: { color: '#1C1400', fontSize: 13, fontFamily: FONT.bodyBold },
  ticketCancel: { width: '100%', paddingVertical: 12, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: C.glassBorder, alignItems: 'center' },
  ticketCancelTxt: { color: C.textDim, fontSize: 12 },

  redeemTag: { fontSize: 11, letterSpacing: 1.6, textTransform: 'uppercase', color: C.cyan, fontFamily: FONT.bodySemi, marginBottom: 12 },
  redeemSub: { fontSize: 13, color: C.textDim, marginBottom: 6 },
  redeemIcon: { fontSize: 34, marginVertical: 10 },
  redeemTitle: { fontFamily: FONT.playfair, fontSize: 17, color: '#fff', marginBottom: 8 },
  redeemHint: { fontSize: 12, color: C.textDim, lineHeight: 19, marginBottom: 20, textAlign: 'center' },
  redeemBtns: { width: '100%', gap: 8 },
  redeemBtnWrap: { width: '100%' },
  redeemShareBtn: { width: '100%', paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  redeemShareTxt: { color: '#fff', fontSize: 13, fontFamily: FONT.bodySemi },
  redeemCancelBtn: { width: '100%', paddingVertical: 12, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: C.glassBorder },

  mysteryRevealTitle: { fontFamily: FONT.playfairItalic, fontSize: 20, color: 'rgba(255,255,255,0.95)', marginBottom: 8 },
  mysteryRevealIcon: { fontSize: 42, marginVertical: 14 },
  mysteryRevealName: { fontSize: 11, color: C.textDim, marginTop: 3 },
  mysteryRevealDesc: { fontSize: 12, color: C.textDim, marginTop: 6, textAlign: 'center' },
  mysteryRevealBtn: { paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
  mysteryRevealBtnTxt: { color: '#fff', fontSize: 13, fontFamily: FONT.bodySemi },
});
