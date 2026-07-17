import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, ScrollView, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, FONT } from '../theme';
import { useStore, friendlyDate } from '../store';
import { SHOP_ITEMS, MYSTERY_BOX_COST } from '../data';

const { height: H } = Dimensions.get('window');

function ShopItemRow({ item, gt, canAfford, onBuy }) {
  const can = gt ? canAfford : canAfford;
  const costLabel = gt ? '1 🎫' : `❤️ ${item.cost}`;
  return (
    <View style={styles.shopItem}>
      <View style={styles.shopItemLeft}>
        <Text style={styles.shopItemIcon}>{item.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.shopItemTitle}>{item.title}</Text>
          <Text style={styles.shopItemDesc}>{item.desc}</Text>
        </View>
      </View>
      <View style={styles.shopItemRight}>
        <Text style={styles.shopItemCost}>{costLabel}</Text>
        <Pressable disabled={!can} onPress={() => onBuy(item.id)}>
          {can && gt ? (
            <LinearGradient colors={['#F59E0B', '#FCD34D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.buyBtn}>
              <Text style={[styles.buyTxt, { color: '#1C1400' }]}>Use 🎫</Text>
            </LinearGradient>
          ) : can ? (
            <LinearGradient colors={['#EC4899', '#A855F7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.buyBtn}>
              <Text style={styles.buyTxt}>Claim</Text>
            </LinearGradient>
          ) : (
            <View style={[styles.buyBtn, styles.buyBtnDisabled]}>
              <Text style={[styles.buyTxt, { color: C.textDim }]}>Need ❤️</Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function Section({ label, items, gt, hearts, tickets, onBuy }) {
  return (
    <View>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.grid}>
        {items.map((item) => (
          <ShopItemRow key={item.id} item={item} gt={gt} canAfford={gt ? tickets > 0 : hearts >= item.cost} onBuy={onBuy} />
        ))}
      </View>
    </View>
  );
}

export default function ShopSheet() {
  const {
    s, shopOpen, setShopOpen, shopPanel, setShopPanel,
    buyItem, openMysteryBox, claimDailyGift, openTicketPopup, deactivateGoldenTicket,
    openRedeem, markReceived,
  } = useStore();

  const slide = useRef(new Animated.Value(H)).current;
  const fade = useRef(new Animated.Value(0)).current;
  // Once the slide-in finishes we drop the animated transform entirely.
  // With the native driver, Fabric's shadow tree keeps the *initial* transform
  // (translateY: H) for hit-testing, which on Android blocks the ScrollView
  // from ever claiming pan gestures (taps still work — they use the view
  // matrix). Rendering without the transform re-commits identity geometry
  // to the shadow tree so scrolling works. (facebook/react-native#44768)
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    if (shopOpen) {
      setSettled(false);
      slide.setValue(H); fade.setValue(0);
      Animated.parallel([
        Animated.timing(slide, { toValue: 0, duration: 380, useNativeDriver: true }),
        Animated.timing(fade, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start(({ finished }) => { if (finished) setSettled(true); });
    }
  }, [shopOpen]);

  const close = () => setShopOpen(false);
  const gt = s.goldenTicketMode;
  const dailyClaimed = s.lastDailyGiftDate === todayLocal();

  if (!shopOpen) return null;

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.backdrop, { opacity: fade }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
      </Animated.View>
      <Animated.View style={[styles.sheet, settled ? null : { transform: [{ translateY: slide }] }]}>
        {shopPanel === 'shop' && (
          <View style={styles.panel}>
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Love Rewards</Text>
                <Text style={styles.subtitle}>Spend your hearts on real-life rewards 💜</Text>
              </View>
              <View style={styles.headerRight}>
                <View style={styles.bal}><Text>❤️</Text><Text style={styles.balTxt}>{s.hearts}</Text></View>
                <Pressable style={styles.ticketBtn} onPress={openTicketPopup}>
                  <Text style={styles.ticketTxt}>🎫{s.goldenTickets}</Text>
                </Pressable>
                <Pressable style={styles.iconBtn} onPress={() => setShopPanel('inventory')}><Text style={{ fontSize: 17 }}>📦</Text></Pressable>
                <Pressable style={styles.iconBtn} onPress={() => setShopPanel('memories')}><Text style={{ fontSize: 17 }}>💌</Text></Pressable>
              </View>
            </View>

            {gt && (
              <View style={styles.goldenBanner}>
                <Text style={styles.goldenTxt}>🎫 Golden Ticket Active — Every reward costs 1 🎫</Text>
                <Pressable style={styles.goldenCancel} onPress={deactivateGoldenTicket}><Text style={styles.goldenCancelTxt}>Cancel</Text></Pressable>
              </View>
            )}

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
              <View style={styles.dailyGift}>
                <View style={styles.dailyLeft}>
                  <Text style={styles.dailyIcon}>🎁</Text>
                  <View>
                    <Text style={styles.dailyTitle}>Daily Love Gift</Text>
                    <Text style={styles.dailySub}>Free +25 ❤️ just for showing up</Text>
                  </View>
                </View>
                <Pressable disabled={dailyClaimed} onPress={claimDailyGift}>
                  {dailyClaimed ? (
                    <View style={[styles.dailyBtn, styles.dailyBtnOff]}><Text style={[styles.dailyBtnTxt, { color: C.textDim }]}>Come back tomorrow ✓</Text></View>
                  ) : (
                    <LinearGradient colors={['#EC4899', '#A855F7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.dailyBtn}><Text style={styles.dailyBtnTxt}>Claim</Text></LinearGradient>
                  )}
                </Pressable>
              </View>

              <View style={styles.mystery}>
                <View style={styles.mysteryLeft}>
                  <Text style={styles.mysteryIcon}>🎲</Text>
                  <View>
                    <Text style={styles.mysteryTitle}>Mystery Box</Text>
                    <Text style={styles.mysterySub}>Common · Rare · Epic · Legendary drops</Text>
                  </View>
                </View>
                <View style={styles.mysteryRight}>
                  <Text style={styles.mysteryCost}>❤️ {MYSTERY_BOX_COST}</Text>
                  <Pressable onPress={openMysteryBox}>
                    <LinearGradient colors={[C.violet, C.cyan]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.mysteryBtn}><Text style={styles.mysteryBtnTxt}>Open</Text></LinearGradient>
                  </Pressable>
                </View>
              </View>

              <Section label="✨ Tiny Rewards" items={SHOP_ITEMS.tiny} gt={gt} hearts={s.hearts} tickets={s.goldenTickets} onBuy={buyItem} />
              <Section label="🍬 Sweet Rewards" items={SHOP_ITEMS.sweet} gt={gt} hearts={s.hearts} tickets={s.goldenTickets} onBuy={buyItem} />
              <Section label="💎 Premium Rewards" items={SHOP_ITEMS.premium} gt={gt} hearts={s.hearts} tickets={s.goldenTickets} onBuy={buyItem} />
              <Section label="👑 Legendary Rewards" items={SHOP_ITEMS.legendary} gt={gt} hearts={s.hearts} tickets={s.goldenTickets} onBuy={buyItem} />
            </ScrollView>
            <Pressable style={styles.closeBtn} onPress={close}><Text style={styles.closeTxt}>✕</Text></Pressable>
          </View>
        )}

        {shopPanel === 'inventory' && (
          <View style={styles.panel}>
            <View style={styles.header}>
              <Pressable style={styles.backBtn} onPress={() => setShopPanel('shop')}><Text style={styles.backTxt}>‹</Text></Pressable>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Inventory</Text>
                <Text style={styles.subtitle}>Things you've claimed but haven't redeemed yet</Text>
              </View>
              <Pressable style={styles.iconBtn} onPress={() => setShopPanel('memories')}><Text style={{ fontSize: 17 }}>💌</Text></Pressable>
            </View>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
              {s.inventory.length === 0 ? (
                <Text style={styles.emptyTxt}>Nothing here yet.{'\n'}Claim rewards from the shop 💜</Text>
              ) : (
                s.inventory.map((item) => (
                  <View key={item.uid} style={styles.invItem}>
                    <View style={styles.invLeft}>
                      <Text style={styles.invIcon}>{item.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.invTitle}>{item.title}</Text>
                        <Text style={styles.invCount}>Purchased {friendlyDate(item.purchaseDate)}</Text>
                      </View>
                    </View>
                    <Pressable onPress={() => openRedeem(item)}>
                      <LinearGradient colors={['#A855F7', '#00E5FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.useBtn}><Text style={styles.useTxt}>Redeem</Text></LinearGradient>
                    </Pressable>
                  </View>
                ))
              )}
              <AwaitingList awaiting={s.awaiting} onReceived={markReceived} />
            </ScrollView>
            <Pressable style={styles.closeBtn} onPress={close}><Text style={styles.closeTxt}>✕</Text></Pressable>
          </View>
        )}

        {shopPanel === 'memories' && (
          <View style={styles.panel}>
            <View style={styles.header}>
              <Pressable style={styles.backBtn} onPress={() => setShopPanel('shop')}><Text style={styles.backTxt}>‹</Text></Pressable>
              <View>
                <Text style={styles.title}>Love Memories 💌</Text>
                <Text style={styles.subtitle}>Every promise he kept, forever saved</Text>
              </View>
            </View>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
              <MemoriesList memories={s.memories} />
            </ScrollView>
            <Pressable style={styles.closeBtn} onPress={close}><Text style={styles.closeTxt}>✕</Text></Pressable>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function AwaitingList({ awaiting, onReceived }) {
  if (!awaiting.length) return null;
  const groups = {};
  awaiting.forEach((item) => { (groups[item.redeemDate] = groups[item.redeemDate] || []).push(item); });
  const dates = Object.keys(groups).sort().reverse();
  return (
    <View>
      <Text style={styles.awaitLabel}>⏳ Awaiting Delivery</Text>
      {dates.map((date) => (
        <View key={date}>
          <Text style={styles.dateGroup}>{friendlyDate(date)}</Text>
          {groups[date].map((item) => (
            <View key={item.uid} style={styles.awaitItem}>
              <View style={styles.awaitLeft}>
                <Text style={styles.awaitIcon}>{item.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.awaitTitle}>{item.title}</Text>
                  <Text style={styles.awaitDate}>Redeemed {friendlyDate(item.redeemDate)}</Text>
                </View>
              </View>
              <Pressable style={styles.receivedBtn} onPress={() => onReceived(item.uid)}><Text style={styles.receivedTxt}>✓ Received</Text></Pressable>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function MemoriesList({ memories }) {
  if (!memories.length) {
    return <Text style={styles.emptyTxt}>No memories yet.{'\n'}When he fulfils a reward, it will live here forever 💌</Text>;
  }
  const groups = {};
  memories.forEach((item) => { (groups[item.receivedDate] = groups[item.receivedDate] || []).push(item); });
  const dates = Object.keys(groups).sort().reverse();
  return (
    <View>
      {dates.map((date) => (
        <View key={date}>
          <Text style={styles.dateGroup}>{friendlyDate(date)}</Text>
          <View style={styles.memGroup}>
            {groups[date].map((item) => (
              <View key={item.uid} style={styles.memItem}>
                <Text style={styles.memIcon}>{item.icon}</Text>
                <Text style={styles.memTitle}>{item.title}</Text>
                <Text style={styles.memCheck}>✓</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, height: H * 0.88, maxHeight: H * 0.88, backgroundColor: '#0B0F18', borderTopWidth: 1, borderTopColor: C.glassBorder, borderTopLeftRadius: 26, borderTopRightRadius: 26, overflow: 'hidden' },
  panel: { flex: 1 },
  scrollView: { flex: 1, minHeight: 0 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.glassBorder },
  title: { fontFamily: FONT.playfairItalic, fontSize: 20, color: 'rgba(255,255,255,0.95)' },
  subtitle: { fontSize: 11, color: C.textDim, marginTop: 3 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bal: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(236,72,153,0.12)', borderWidth: 1, borderColor: 'rgba(236,72,153,0.3)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  balTxt: { fontFamily: FONT.bodyBold, fontSize: 14, color: C.pink },
  ticketBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(251,191,36,0.12)', borderWidth: 1, borderColor: 'rgba(251,191,36,0.35)', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 20 },
  ticketTxt: { color: C.gold, fontFamily: FONT.bodyBold, fontSize: 13 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: C.glassBorder, alignItems: 'center', justifyContent: 'center' },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: C.glassBorder, alignItems: 'center', justifyContent: 'center' },
  backTxt: { color: C.textMain, fontSize: 20 },
  goldenBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(251,191,36,0.14)', borderBottomWidth: 1, borderBottomColor: 'rgba(251,191,36,0.3)', paddingHorizontal: 20, paddingVertical: 10 },
  goldenTxt: { flex: 1, fontSize: 12, color: C.gold, fontFamily: FONT.bodySemi },
  goldenCancel: { backgroundColor: 'rgba(251,191,36,0.15)', borderWidth: 1, borderColor: 'rgba(251,191,36,0.3)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  goldenCancelTxt: { color: C.gold, fontSize: 11 },
  scroll: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 40 },
  closeBtn: { position: 'absolute', top: 20, right: 18, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  closeTxt: { color: C.textDim, fontSize: 15 },

  dailyGift: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, backgroundColor: 'rgba(236,72,153,0.10)', borderWidth: 1, borderColor: 'rgba(236,72,153,0.25)', borderRadius: 18, padding: 16, marginBottom: 14 },
  dailyLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  dailyIcon: { fontSize: 26 },
  dailyTitle: { fontSize: 13.5, fontFamily: FONT.bodySemi, color: 'rgba(255,255,255,0.95)' },
  dailySub: { fontSize: 11, color: C.textDim, marginTop: 2 },
  dailyBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 22 },
  dailyBtnOff: { backgroundColor: 'rgba(255,255,255,0.08)' },
  dailyBtnTxt: { fontSize: 11, fontFamily: FONT.bodyBold, letterSpacing: 0.6, textTransform: 'uppercase', color: '#fff' },

  mystery: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, backgroundColor: 'rgba(124,58,237,0.14)', borderWidth: 1, borderColor: 'rgba(124,58,237,0.3)', borderRadius: 18, padding: 16, marginBottom: 20 },
  mysteryLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  mysteryIcon: { fontSize: 26 },
  mysteryTitle: { fontSize: 13.5, fontFamily: FONT.bodySemi, color: 'rgba(255,255,255,0.95)' },
  mysterySub: { fontSize: 11, color: C.textDim, marginTop: 2 },
  mysteryRight: { alignItems: 'flex-end', gap: 6 },
  mysteryCost: { fontSize: 12, fontFamily: FONT.bodyBold, color: C.cyan },
  mysteryBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  mysteryBtnTxt: { color: '#fff', fontSize: 11, fontFamily: FONT.bodyBold },

  sectionLabel: { fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase', color: C.textDim, marginBottom: 10, marginTop: 4 },
  grid: { gap: 11, marginBottom: 20 },
  shopItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: C.glassBorder, borderRadius: 16, padding: 14 },
  shopItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  shopItemIcon: { fontSize: 24, width: 38, textAlign: 'center' },
  shopItemTitle: { fontSize: 13.5, fontFamily: FONT.bodyMed, color: 'rgba(255,255,255,0.92)' },
  shopItemDesc: { fontSize: 10.5, color: C.textDim, marginTop: 2 },
  shopItemRight: { alignItems: 'flex-end', gap: 6 },
  shopItemCost: { fontSize: 12, fontFamily: FONT.bodyBold, color: C.pink },
  buyBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  buyBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.06)' },
  buyTxt: { color: '#fff', fontSize: 11, fontFamily: FONT.bodyBold, letterSpacing: 0.4 },

  invItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: C.glassBorder, borderRadius: 16, padding: 14, marginBottom: 11 },
  invLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  invIcon: { fontSize: 24, width: 38, textAlign: 'center' },
  invTitle: { fontSize: 13.5, fontFamily: FONT.bodyMed, color: 'rgba(255,255,255,0.92)' },
  invCount: { fontSize: 11, color: C.textDim, marginTop: 2 },
  useBtn: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20 },
  useTxt: { color: '#fff', fontSize: 11, fontFamily: FONT.bodyBold },
  emptyTxt: { textAlign: 'center', color: C.textDim, fontSize: 12.5, paddingVertical: 50, paddingHorizontal: 20, lineHeight: 21 },

  awaitLabel: { fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase', color: C.purple, fontFamily: FONT.bodySemi, marginTop: 18, marginBottom: 10 },
  dateGroup: { fontSize: 10, letterSpacing: 1, color: C.textDim, paddingTop: 14, paddingBottom: 8 },
  awaitItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: 'rgba(124,58,237,0.2)', borderRadius: 16, padding: 14, marginBottom: 10 },
  awaitLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  awaitIcon: { fontSize: 22, width: 36, textAlign: 'center' },
  awaitTitle: { fontSize: 13, fontFamily: FONT.bodyMed, color: 'rgba(255,255,255,0.9)' },
  awaitDate: { fontSize: 10.5, color: C.textDim, marginTop: 2 },
  receivedBtn: { backgroundColor: 'rgba(0,229,255,0.1)', borderWidth: 1, borderColor: 'rgba(0,229,255,0.3)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  receivedTxt: { color: C.cyan, fontSize: 10, fontFamily: FONT.bodySemi },

  memGroup: { marginBottom: 10, backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 6 },
  memItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  memIcon: { fontSize: 20, width: 34, textAlign: 'center' },
  memTitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)', flex: 1 },
  memCheck: { fontSize: 11, color: C.cyan },
});
