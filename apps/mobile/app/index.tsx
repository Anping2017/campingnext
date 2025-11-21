import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function Home() {
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>露营个性化推荐应用</Text>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>营地查找</Text>
          <Text style={styles.cardDescription}>
            基于地理位置和需求查找理想营地
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>装备管理</Text>
          <Text style={styles.cardDescription}>
            个性化装备推荐和管理
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>社区分享</Text>
          <Text style={styles.cardDescription}>
            分享露营经验和心得
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>行程制定</Text>
          <Text style={styles.cardDescription}>
            智能规划露营行程
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#171717',
  },
  card: {
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    color: '#171717',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
