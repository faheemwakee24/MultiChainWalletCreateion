import React, { useState } from "react";
import {
  View,
  TextInput,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
} from "react-native";
import { WebView } from "react-native-webview";
import Web3 from "web3"; // Import Web3.js

const BrowserHome = () => {
  const [tabs, setTabs] = useState([{ id: 1, url: "https://app.uniswap.org/" }]);
  const [currentTab, setCurrentTab] = useState(1);
  const [url, setUrl] = useState(tabs[0].url);
  const [darkMode, setDarkMode] = useState(false);
  const [web3Instance, setWeb3Instance] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  const [webViewKey, setWebViewKey] = useState(0); // Add this state

  const handleGoPress = () => {
    const updatedTabs = tabs.map((tab) =>
      tab.id === currentTab ? { ...tab, url } : tab
    );
    setTabs(updatedTabs); // Update the tab's URL
    setWebViewKey((prevKey) => prevKey + 1); // Increment the key to refresh the WebView
  };
  
  // Initialize Web3.js
  const initWeb3 = async () => {
    if (typeof window.ethereum !== "undefined") {
      const web3 = new Web3(window.ethereum);
      setWeb3Instance(web3);
      try {
        const accounts = await web3.eth.requestAccounts();
        setWalletAddress(accounts[0]);
      } catch (error) {
        Alert.alert("Error", "Could not connect to the wallet.");
      }
    } else {
      Alert.alert("Error", "Ethereum provider not found. Install MetaMask or another provider.");
    }
  };

  const addTab = () => {
    const newTab = { id: tabs.length + 1, url: "https://www.google.com" };
    setTabs([...tabs, newTab]);
    setCurrentTab(newTab.id);
    setUrl(newTab.url);
  };

  const closeTab = (id) => {
    if (tabs.length === 1) {
        setUrl("https://www.google.com");
        handleGoPress()
      return; // Prevent closing the last tab
    }
  
    const updatedTabs = tabs.filter((tab) => tab.id !== id);
    setTabs(updatedTabs);
  
    // Update the current tab to the next available tab
    if (currentTab === id && updatedTabs.length > 0) {
      setCurrentTab(updatedTabs[0].id);
      setUrl(updatedTabs[0].url);
    } else if (updatedTabs.length === 0) {
      setUrl(""); // Clear the URL if no tabs remain (though this shouldn't happen with the check above)
    }
  };
  

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  const injectedJS = `
    document.body.style.backgroundColor = "${darkMode ? "#121212" : "#ffffff"}";
    document.body.style.color = "${darkMode ? "#ffffff" : "#000000"}";
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_requestAccounts' });
    }
    true;
  `;

  const sendTransaction = async () => {
    if (!web3Instance || !walletAddress) {
      Alert.alert("Error", "Connect your wallet first.");
      return;
    }

    const transactionParameters = {
      to: "0xRecipientAddressHere", // Replace with the recipient address
      from: walletAddress,
      value: web3Instance.utils.toHex(web3Instance.utils.toWei("0.01", "ether")),
    };

    try {
      const txHash = await web3Instance.eth.sendTransaction(transactionParameters);
      Alert.alert("Transaction Sent", `Hash: ${txHash.transactionHash}`);
    } catch (error) {
      Alert.alert("Error", "Transaction failed.");
    }
  };

  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      {/* Address Bar */}
      <View style={styles.addressBar}>
        <TextInput
          style={[styles.input, darkMode && styles.darkInput]}
          value={url}
          onChangeText={setUrl}
          placeholder="Enter URL"
          placeholderTextColor={darkMode ? "#bbb" : "#888"}
        />
        <TouchableOpacity style={styles.button} onPress={handleGoPress}>
          <Text style={[styles.buttonText, darkMode && styles.darkButtonText]}>Go</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={addTab}>
          <Text style={[styles.buttonText, darkMode && styles.darkButtonText]}>+ Tab</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Manager */}
      <View style={{ height: 70 }}>
        <ScrollView horizontal style={styles.tabContainer}>
          {tabs.map((item) => (
            <View key={item.id} style={styles.tabWrapper}>
              <TouchableOpacity
                style={[
                  styles.tab,
                  item.id === currentTab && styles.activeTab,
                  darkMode && styles.darkTab,
                ]}
                onPress={() => setCurrentTab(item.id)}
              >
                <Text
                  style={[
                    styles.tabText,
                    item.id === currentTab && styles.activeTabText,
                  ]}
                >
                  Tab {item.id}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeTabButton}
                onPress={() => closeTab(item.id)}
              >
                <Text style={styles.closeTabText}>X</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* WebView */}
      <View style={{ flex: 1 }}>
      {tabs.map(
  (tab) =>
    tab.id === currentTab && (
      <WebView
        key={`${tab.id}-${webViewKey}`} // Add webViewKey to force reload
        source={{ uri: tab.url }} // Use the updated URL for the current tab
        style={{ flex: 1 }}
        injectedJavaScript={injectedJS}
        javaScriptEnabled={true}
        onNavigationStateChange={(navState) => setUrl(navState.url)}
      />
    )
)}

      </View>

      {/* Footer (for Dark Mode toggle and transaction button) */}
      {/* <View style={[styles.footer, darkMode && styles.darkFooter]}>
        <View style={styles.darkModeSwitch}>
          <Text style={[styles.darkModeText, darkMode && styles.darkModeTextDark]}>
            Dark Mode
          </Text>
          <Switch value={darkMode} onValueChange={toggleDarkMode} />
        </View>
        <TouchableOpacity onPress={sendTransaction} style={styles.button}>
          <Text style={[styles.buttonText, darkMode && styles.darkButtonText]}>Send Transaction</Text>
        </TouchableOpacity>
      </View> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  darkContainer: {
    backgroundColor: "#121212",
  },
  addressBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingHorizontal: 10,
    marginRight: 10,
    height: 40,
  },
  darkInput: {
    borderColor: "#444",
    backgroundColor: "#333",
    color: "#fff",
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginLeft: 10,
    backgroundColor: "#6200EE",
    borderRadius: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
  darkButtonText: {
    color: "#ddd",
  },
  tabContainer: {
    backgroundColor: "#f3f4f5",
    paddingVertical: 5,
    height: 20,
    flex: 1,
  },
  tabWrapper: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    marginHorizontal: 5,
  },
  tab: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: "#e0e0e0",
  },
  activeTab: {
    backgroundColor: "#6200EE",
  },
  darkTab: {
    backgroundColor: "#333",
  },
  tabText: {
    color: "#000",
  },
  activeTabText: {
    color: "#fff",
  },
  closeTabButton: {
    marginLeft: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  closeTabText: {
    color: "#6200EE",
    fontSize: 18,
    fontWeight: "bold",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    backgroundColor: "#fff",
  },
  darkFooter: {
    backgroundColor: "#333",
  },
  darkModeSwitch: {
    flexDirection: "row",
    alignItems: "center",
  },
  darkModeText: {
    fontSize: 16,
    marginRight: 10,
  },
  darkModeTextDark: {
    color: "#ddd",
  },
});

export default BrowserHome;
