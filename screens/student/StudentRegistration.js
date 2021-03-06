import { StyleSheet, Text, TextInput, View, TouchableOpacity,Image,ScrollView,Platform } from 'react-native'
import React, { useState, useEffect, useRef } from 'react';
import KeyboardAvoidingView from 'react-native/Libraries/Components/Keyboard/KeyboardAvoidingView'
import { auth, db, storage } from '../firebase'
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigation } from '@react-navigation/core'
import { addDoc, collection, Firestore, updateDoc,doc , setDoc} from "firebase/firestore"; 
import * as ImagePicker from 'expo-image-picker';
import {Ionicons} from "@expo/vector-icons";
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { setStatusBarStyle } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import * as Permissions from 'expo-permissions';
import Constants from "expo-constants";
import * as Device from 'expo-device';




const StudentRegistration = () => {

  // fields taken from registration form 
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNum] = useState('')
  const [birthday, setBirthday] = useState('')
  const [gender, setGender] = useState('')
  const [race, setRace] = useState('')
  const [region, setRegion] = useState('')
  const [neededSub, setNeededSub] = useState('')
  const [priceRange, setPriceRange] = useState('')
  const [availSchedule , setAvailSchedule] = useState('')
  const [image , setImage] = useState('')
  const [progress , setProgress] = useState(0)
  const [url , setURL] = useState('')
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();
    
    
 
  const navigation = useNavigation();
  var additionalData = [fullName,phoneNumber,birthday,gender,race,region,neededSub,priceRange,availSchedule]

  const handleSignUp =  () => {
        createUserWithEmailAndPassword(auth,email,password)
        .then(userCredentials => { 
          const user = userCredentials.user
          console.log('Registered with:', user.email)
          createUserDocument(user,additionalData)
        })
        .then(() => { 
          navigation.navigate("Home")
        })
        .catch((error) => {
          if (error.code == "auth/email-already-in-use") {
              alert("The email address is already in use");
          } else if (error.code == "auth/invalid-email") {
              alert("The email address is not valid.");
          } else if (error.code == "auth/operation-not-allowed") {
              alert("Operation not allowed.");
          } else if (error.code == "auth/weak-password") {
              alert("The password is too weak.");
          }
        })
        
    }
    
    const createUserDocument = async (user,additionalData) => { 
      if (!user) return; 
      
      //fields for documentation 
      const email = user.email; 
      const fullName = additionalData[0]; 
      const phoneNum = additionalData[1]; 
      const birthday = additionalData[2]; 
      const gender = additionalData[3]; 
      const race = additionalData[4]; 
      const region = additionalData[5]; 
      const neededSub = additionalData[6]; 
      const priceRange = additionalData[7]; 
      const availSchedule = additionalData[8]; 
      uploadImage(image,user.uid);
      

      try { 
          console.log("try entered with: " + user.uid);
          await setDoc(doc(db,"student",user.uid) , { 
              userID: user.uid,
              fullName: fullName,
              email: email,
              phoneNumber: phoneNum,
              birthday: birthday,
              gender:gender,
              race:race, 
              region:region, 
              neededSubject:neededSub,
              priceRange:priceRange, 
              availSchedule:availSchedule,
              image:`images/${user.uid}.png`,
              url:url,
              id: user.uid,
              token: expoPushToken,

          }); 
          console.log("user data added");
      } catch (e) {
        console.log('We have the error', e);
      }
    };

    
    const handleBack =  async () => {
        await navigation.replace("StudentLogin")
        .catch(error => alert(error.message))
    }
    useEffect(() => {
      (async () => {
        if (Platform.OS !== 'web') {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            alert('Sorry, we need camera roll permissions to make this work!');
          }
        }
      })();
    }, []);
  

    // uploading profile pics to firebase storage 
    const pickImage = async () => {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [7, 10],
        quality: 1,
      });
  
      console.log(result);
  
      if (!result.cancelled) {
        setImage(result.uri);
      }
    };

    const uploadImage = (pic,id) => { 
      if (!pic) return; 
      const storageRef = ref(storage,`images/${id}.png`);
      const uploadTask = uploadBytesResumable(storageRef, pic);
      uploadTask.on("state-changed", (snapshot)  => { 
        const prog = Math.round(
          (snapshot.bytesTransferred/snapshot.totalBytes) * 100 
        );
        setProgress(progress);
      },
      (err) => console.log(err),
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((url) => {
          console.log(url)
        })
         
       
      }
      )
    }

    // push notification setup - retirieving expo push token 
    registerForPushNotificationsAsync = async () => {
      if (Device.isDevice) {
        const { status: existingStatus } = await Permissions.getAsync(Permissions.NOTIFICATIONS);
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS);
          finalStatus = status;
        }
        if (finalStatus !== 'granted') {
          alert('Failed to get push token for push notification!');
          return;
        }
        const token = await (await Notifications.getExpoPushTokenAsync()).data;
        console.log(token);
        return token;
      
      }
  }

    useEffect(() => {
      registerForPushNotificationsAsync().then(token => setExpoPushToken(token));
    }, []);



    return (
        <KeyboardAvoidingView
          style={styles.container}
          
        >
          <ScrollView>
          <View 
              style={{alignItems:"center",justifyContent:"center" }}>
                <TouchableOpacity
                title="Upload Image" 
                image = "https://www.vectorstock.com/royalty-free-vectors/avatar-placeholder-vectors"
                onPress={pickImage}
                style={styles.avatarPlaceholder} > 
               <Image source={{ uri: image }} style={styles.avatar} />
                <Ionicons
                name="ios-add"
                size={40}
                color="FFF"
                style={{ marginTop:10, marginLeft:2 }}
                ></Ionicons>
                
                </TouchableOpacity>
                
              </View> 
          <View style={styles.inputContainer}> 
          <TextInput 
              placeholder="Full Name as on NRIC"
              value={fullName}
              onChangeText={text => setFullName(text)}
              style={styles.input}
            />
            <TextInput 
              placeholder="Email"
              value={email}
              onChangeText={text => setEmail(text)}
              style={styles.input}
            />
            <TextInput 
              placeholder="Phone Number"
              value={phoneNumber}
              onChangeText={text => setPhoneNum(text)}
              style={styles.input}
            />
            <TextInput 
              placeholder="Birthday"
              value={birthday}
              onChangeText={text => setBirthday(text)}
              style={styles.input}
            />
            <TextInput 
              placeholder="Gender"
              value={gender}
              onChangeText={text => setGender(text)}
              style={styles.input}
            />
            
            <TextInput 
              placeholder="Race"
              value={race}
              onChangeText={text => setRace(text)}
              style={styles.input}
            />
            <TextInput 
              placeholder="Region"
              value={region}
              onChangeText={text => setRegion(text)}
              style={styles.input}
            />
            <TextInput 
              placeholder="Password"
              value={password}
              onChangeText={text => setPassword(text)}
              style={styles.input}
              secureTextEntry
            />
            <TextInput 
              placeholder="Subject Needed"
              value={neededSub}
              onChangeText={text => setNeededSub(text)}
              style={styles.input}
            />
            <TextInput 
              placeholder="Price Range"
              value={priceRange}
              onChangeText={text => setPriceRange(text)}
              style={styles.input}
            />
            <TextInput 
              placeholder="Available Schedule"
              value={availSchedule}
              onChangeText={text => setAvailSchedule(text)}
              style={styles.input}
            />
            <TextInput 
              placeholder="Input Photo URL Here"
              value={url}
              onChangeText={text => setURL(text)}
              style={styles.input}
            />
          </View> 
        
          <View style={styles.buttonContainer}>
             <TouchableOpacity
              onPress={handleSignUp}
              style={[styles.button, styles.buttonOutline]}
            >
              <Text style={styles.buttonOutlineText}>Register</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleBack}
              style={styles.buttonNew}
            >
              <Text style={styles.buttonTextNew}>Back</Text>
            </TouchableOpacity>
          </View> 
          </ScrollView>
        </KeyboardAvoidingView>   
      )
    }
    
    export default StudentRegistration
    
    const styles = StyleSheet.create({
      container: { 
        flex: 1,
        justifyContent: 'center', 
        //alignItems: 'center',
        paddingHorizontal:9,
       marginLeft:65,
      },
      inputContainer: {
          width: '80%'
    
      },
    input: { 
        backgroundColor: '#b4c3d3',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 10,
        marginTop: 5,
    
    },
    buttonContainer: {
        width: '70%',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        marginLeft:18,
    },
    button: {
        backgroundColor: '#b4c3d3',
        width: '100%',
        padding: 15, 
        borderRadius: 10, 
        alignItems: 'center',
    },
    buttonOutline: {
        backgroundColor: '#03254c',
        width: '100%',
        padding: 15, 
        borderRadius: 10, 
        alignItems: 'center',
    
    },
    buttonText: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 16, 
    },
    buttonOutlineText: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 16, 
    
    },
    buttonTextNew: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 14, 
        
    },

    buttonNew: {
        backgroundColor: '#03254c',
        width: '40%',
        padding: 15, 
        borderRadius: 10, 
        alignItems: 'center',
        marginTop: 10,
    },
     avatarPlaceholder: {
      backgroundColor: '#e1e2e9',
      width: 100,
      height: 100,
      borderRadius: 50, 
      alignItems: 'center',
      marginTop: 10,
      marginBottom: 20,
      justifyContent: "center",
      alignItems: "center",
      marginRight:70,
     },
     avatar: {
      position:"absolute",
      width: 100,
      height: 100,
      borderRadius: 50, 
      
      
     }
    
    })