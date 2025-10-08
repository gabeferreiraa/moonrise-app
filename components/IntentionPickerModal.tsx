// // components/IntentionPickerModal.tsx
// import { Picker } from "@react-native-picker/picker";
// import { BlurView } from "expo-blur";
// import React, { useRef, useState } from "react";
// import {
//   Dimensions,
//   Modal,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from "react-native";

// const { width, height } = Dimensions.get("window");

// export const INTENTIONS = [
//   "Full Guided",
//   "Clarity",
//   "Healing and restoration",
//   "Release",
//   "Connection",
//   "Gratitude",
//   "Peace",
//   "Love",
//   "Strength",
//   "Creativity",
//   "Vision",
//   "Balance",
//   "Renewal",
//   "Confidence",
//   "Donuts 🍩",
//   "Nada Yoga",
//   "Joy!",
//   "Generosity",
//   "Surrender and trust",
//   "Happiness",
//   "Curiosity",
//   "Fierce compassion",
//   "Focus",
//   "Patience",
//   "Custom...",
// ];

// type Version = "full" | "guided" | "birth" | "life" | "death";

// interface IntentionPickerModalProps {
//   visible: boolean;
//   onSelect: (intention: string, audioMode: Version) => void;
//   onSkip: () => void;
// }

// export const IntentionPickerModal: React.FC<IntentionPickerModalProps> = ({
//   visible,
//   onSelect,
//   onSkip,
// }) => {
//   const [selectedIntention, setSelectedIntention] = useState(INTENTIONS[0]);
//   const [customIntention, setCustomIntention] = useState("");
//   const [showCustomInput, setShowCustomInput] = useState(false);
//   const cycleIndexRef = useRef(0);

//   const handleIntentionChange = (value: string) => {
//     setSelectedIntention(value);
//     if (value === "Custom...") {
//       setShowCustomInput(true);
//     } else {
//       setShowCustomInput(false);
//       setCustomIntention("");
//     }
//   };

//   const getAudioMode = (intention: string): Version => {
//     // Only "Full Guided" and "Custom..." play guided
//     if (intention === "Full Guided" || showCustomInput) {
//       return "guided";
//     }

//     // Everything else cycles through birth, life, death
//     const modes: Version[] = ["birth", "life", "death"];
//     const mode = modes[cycleIndexRef.current % 3];
//     cycleIndexRef.current += 1;

//     return mode;
//   };

//   const handleConfirm = () => {
//     const finalIntention =
//       showCustomInput && customIntention.trim()
//         ? customIntention.trim()
//         : selectedIntention;

//     const audioMode = getAudioMode(selectedIntention);
//     onSelect(finalIntention, audioMode);
//   };

//   return (
//     <Modal
//       visible={visible}
//       animationType="fade"
//       transparent={false}
//       statusBarTranslucent
//     >
//       <BlurView intensity={80} style={styles.container}>
//         <View style={styles.modalContent}>
//           <Text style={styles.title}>Set Your Intention</Text>
//           <Text style={styles.subtitle}>
//             What would you like to invite into this moment?
//           </Text>

//           {/* Picker */}
//           <View style={styles.pickerContainer}>
//             <Picker
//               selectedValue={selectedIntention}
//               onValueChange={handleIntentionChange}
//               style={styles.picker}
//               itemStyle={styles.pickerItem}
//             >
//               {INTENTIONS.map((intention) => (
//                 <Picker.Item
//                   key={intention}
//                   label={intention}
//                   value={intention}
//                   color="#FFECCC"
//                 />
//               ))}
//             </Picker>
//           </View>

//           {/* Custom Input */}
//           {showCustomInput && (
//             <View style={styles.customInputContainer}>
//               <TextInput
//                 style={styles.customInput}
//                 placeholder="Enter your intention..."
//                 placeholderTextColor="#CBBCA4"
//                 value={customIntention}
//                 onChangeText={setCustomIntention}
//                 autoFocus
//                 returnKeyType="done"
//                 onSubmitEditing={handleConfirm}
//               />
//             </View>
//           )}

//           {/* Buttons */}
//           <View style={styles.buttonContainer}>
//             <TouchableOpacity
//               style={[styles.button, styles.skipButton]}
//               onPress={onSkip}
//             >
//               <Text style={styles.skipButtonText}>Skip</Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={[styles.button, styles.confirmButton]}
//               onPress={handleConfirm}
//             >
//               <Text style={styles.confirmButtonText}>Begin</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </BlurView>
//     </Modal>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "#000000",
//     paddingHorizontal: 20,
//   },
//   modalContent: {
//     width: "100%",
//     maxWidth: 500,
//     backgroundColor: "#0C0C0C",
//     borderRadius: 24,
//     borderWidth: 1,
//     borderColor: "#2A2520",
//     padding: 40,
//     alignItems: "center",
//   },
//   title: {
//     fontSize: 32,
//     fontFamily: "Lora_400Regular",
//     fontWeight: "600",
//     color: "#FFECCC",
//     marginBottom: 12,
//     textAlign: "center",
//     letterSpacing: 0.5,
//   },
//   subtitle: {
//     fontSize: 17,
//     fontFamily: "Lora_400Regular",
//     color: "#DEC4A1",
//     marginBottom: 40,
//     textAlign: "center",
//     lineHeight: 24,
//   },
//   pickerContainer: {
//     width: "100%",
//     height: 240,
//     backgroundColor: "#121212",
//     borderRadius: 16,
//     borderWidth: 1,
//     borderColor: "#1A1715",
//     overflow: "hidden",
//     marginBottom: 24,
//   },
//   picker: {
//     width: "100%",
//     height: 240,
//     backgroundColor: "transparent",
//   },
//   pickerItem: {
//     fontSize: 19,
//     color: "#FFECCC",
//     height: 240,
//     fontFamily: "System",
//   },
//   customInputContainer: {
//     width: "100%",
//     marginBottom: 24,
//   },
//   customInput: {
//     backgroundColor: "#121212",
//     borderRadius: 16,
//     padding: 18,
//     fontSize: 17,
//     fontFamily: "System",
//     color: "#FFECCC",
//     borderWidth: 1,
//     borderColor: "#A0B5A8",
//   },
//   buttonContainer: {
//     flexDirection: "row",
//     gap: 16,
//     width: "100%",
//   },
//   button: {
//     flex: 1,
//     paddingVertical: 16,
//     borderRadius: 16,
//     alignItems: "center",
//     borderWidth: 1,
//   },
//   skipButton: {
//     backgroundColor: "transparent",
//     borderColor: "#3A3530",
//   },
//   skipButtonText: {
//     fontSize: 17,
//     color: "#CBBCA4",
//     fontFamily: "System",
//     fontWeight: "500",
//   },
//   confirmButton: {
//     backgroundColor: "#A0B5A8",
//     borderColor: "#A0B5A8",
//   },
//   confirmButtonText: {
//     fontSize: 17,
//     color: "#0C0C0C",
//     fontFamily: "System",
//     fontWeight: "600",
//   },
// });
