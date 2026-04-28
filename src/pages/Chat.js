import { useEffect, useState, useRef } from "react";
import style from "../component/css/Chat.module.css";
import {
  IoFilter,
  IoVideocamOutline,
  IoCall,
  IoAdd,
  IoSendSharp,
  IoCloseCircle,
  IoArrowBack,
} from "react-icons/io5";
import {
  MdOpenInNew,
  MdGroupAdd,
  MdEmojiEmotions,
  MdInsertPhoto,
} from "react-icons/md";
import { RiCheckboxCircleLine } from "react-icons/ri";
import { IoCloseSharp } from "react-icons/io5";
import { BiDotsHorizontal } from "react-icons/bi";
import { IoClose } from "react-icons/io5";
import { FaVideo } from "react-icons/fa";
import { BsLink45Deg } from "react-icons/bs";
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";
import { setUserList, setSelectedUser } from "../redux/ChatSlice";
import EmojiPicker from "emoji-picker-react";
import { MdOutlineSettingsVoice, MdStopCircle } from "react-icons/md";

const Chat = () => {
  const dispatch = useDispatch();
  const userList = useSelector((state) => state.chat.userList) || [];
  const selectedUser = useSelector((state) => state.chat.selectedUser);
  const token = useSelector((state) => state.auth.token);
  const loggedInUsername = useSelector((state) => state.auth.user?.username);
  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const ws = useRef(null);
  const [showFriendRequestModal, setShowFriendRequestModal] = useState(false);
  const [requestedUsers, setRequestedUsers] = useState([]);
  const you = useSelector((state) => state.auth.user);
  const [showPicker, setShowPicker] = useState(false);
  const [recording, setRecording] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef();
  const [previewUrls, setPreviewUrls] = useState([]);
  const [popupFile, setPopupFile] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const [calling, setCalling] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const pendingCandidates = useRef([]);
  const [showModal, setShowModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [groupList, setGroupList] = useState([]);
  const [groupMessages, setGroupMessages] = useState([]);
  const [groupInput, setGroupInput] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [activeView, setActiveView] = useState("left");

  const isMobile = window.innerWidth <= 768;

  useEffect(() => {
    if (!you?.id) return;
    axios
      .get(`http://127.0.0.1:8000/accept-getdata/${you?.id}/`)
      .then((res) => dispatch(setUserList(res.data)))
      .catch((err) => console.error("Error fetching user data", err));
  }, [dispatch, you?.id]);

  useEffect(() => {
    if (!selectedUser || !you) return;

    axios
      .get(`http://127.0.0.1:8000/accepted-friends/${you.id}/`)
      .then((res) => {
        const { sending_messages, receiver_messages } = res.data;

        const filteredSender = sending_messages
          .filter((msg) => msg.receiver === selectedUser.id)
          .map((msg) => ({
            ...msg,
            from: "sender",
            files: Array.isArray(msg.files)
              ? msg.files
                .filter((file) => file && file.file)
                .map((file) => ({
                  id: file.id,
                  url: file.file,
                  name: file.name,
                }))
              : [],
          }));

        const filteredReceiver = receiver_messages
          .filter((msg) => msg.sender === selectedUser.id)
          .map((msg) => ({
            ...msg,
            from: "receiver",
            files: Array.isArray(msg.files)
              ? msg.files
                .filter((file) => file && file.file)
                .map((file) => ({
                  id: file.id,
                  url: file.file,
                  name: file.name,
                }))
              : [],
          }));
        const combinedMessages = [...filteredSender, ...filteredReceiver];

        combinedMessages.sort(
          (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
        );

        setChatMessages(combinedMessages);
      })
      .catch((err) => {
        console.error("Error fetching accepted friend messages", err);
      });
  }, [selectedUser, you]);

  const servers = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };

  useEffect(() => {
    if (!selectedUser || !token) return;

    const wsUrl = `ws://127.0.0.1:8000/ws/chat/${token}/${selectedUser.id}/`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => console.log("WebSocket connected");

    ws.current.onmessage = async (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case "offer":
          setIncomingCall(data.offer);
          break;

        case "answer":
          if (peerConnection.current) {
            await peerConnection.current.setRemoteDescription(
              new RTCSessionDescription(data.answer)
            );
            await applyBufferedCandidates();
          }
          break;

        case "ice":
          if (peerConnection.current) {
            if (peerConnection.current.remoteDescription) {
              await peerConnection.current.addIceCandidate(
                new RTCIceCandidate(data.candidate)
              );
            } else {
              pendingCandidates.current.push(data.candidate);
            }
          } else {
            pendingCandidates.current.push(data.candidate);
          }
          break;

        case "call_end":
          endCall();
          break;
        default:
          break;
      }
    };

    ws.current.onclose = () => console.log("WebSocket disconnected");
    ws.current.onerror = (err) => console.error("WebSocket error:", err);

    return () => {
      if (ws.current) ws.current.close();
      ws.current = null;
    };
  }, [selectedUser, token]);

  const createPeerConnection = async () => {
    if (peerConnection.current) {
      console.warn("Existing peer connection found. Closing...");
      peerConnection.current.close();
      peerConnection.current = null;
    }
    try {
      peerConnection.current = new RTCPeerConnection(servers);
    } catch (err) {
      console.error("Failed to create RTCPeerConnection:", err);
      return; // stop further setup
    }

    if (!peerConnection.current) {
      console.error("RTCPeerConnection creation failed, aborting setup.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      stream.getTracks().forEach((track) => {
        if (peerConnection.current) {
          peerConnection.current.addTrack(track, stream);
        } else {
          console.warn("PeerConnection destroyed before tracks could be added");
        }
      });

      peerConnection.current.onicecandidate = (e) => {
        if (e.candidate) {
          if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(
              JSON.stringify({
                type: "ice",
                candidate: e.candidate,
                from: you.id,
                to: selectedUser.id,
              })
            );
          } else {
            console.warn("WebSocket is not ready, cannot send ICE candidate");
          }
        }
      };

      peerConnection.current.ontrack = (e) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = e.streams[0];
        }
      };
    } catch (err) {
      console.error("Error getting media:", err);
      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }
    }
  };

  const applyBufferedCandidates = async () => {
    for (const candidate of pendingCandidates.current) {
      await peerConnection.current.addIceCandidate(
        new RTCIceCandidate(candidate)
      );
    }
    pendingCandidates.current = [];
  };

  const startCall = async () => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      console.error("WebSocket is not connected. Reconnect and try.");
      return;
    }
    setCalling(true);
    await createPeerConnection();

    if (!peerConnection.current) {
      console.error("PeerConnection not created properly.");
      setCalling(false);
      return;
    }

    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          type: "offer",
          offer,
          from: you.id,
          to: selectedUser.id,
        })
      );
    } else {
      console.warn("WebSocket is not ready, cannot send offer");
    }
  };

  const acceptCall = async () => {
    setCalling(true);
    await createPeerConnection();

    await peerConnection.current.setRemoteDescription(
      new RTCSessionDescription(incomingCall)
    );

    const answer = await peerConnection.current.createAnswer();
    await peerConnection.current.setLocalDescription(answer);

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          type: "answer",
          answer,
          from: you.id,
          to: selectedUser.id,
        })
      );
    } else {
      console.warn("WebSocket is not ready, cannot send answer");
    }

    await applyBufferedCandidates();
    setIncomingCall(null);
  };

  const rejectCall = () => {
    ws.current.send(JSON.stringify({ type: "call_end" }));
    setIncomingCall(null);
  };

  const endCall = () => {
    if (peerConnection.current) {
      peerConnection.current.getSenders().forEach((sender) => {
        if (sender.track) sender.track.stop();
      });

      peerConnection.current.getTransceivers().forEach((transceiver) => {
        transceiver.stop();
      });

      peerConnection.current.close();
      peerConnection.current = null;
    }

    if (localVideoRef.current?.srcObject) {
      localVideoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      localVideoRef.current.srcObject = null;
    }

    if (remoteVideoRef.current?.srcObject) {
      remoteVideoRef.current.srcObject = null;
    }

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: "call_end" }));
    }
    pendingCandidates.current = [];
    setCalling(false);
    setIncomingCall(null);
  };

  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true, // Optional: screen audio (depends on browser)
      });

      // Replace the video track
      const screenTrack = screenStream.getVideoTracks()[0];

      // Replace sender's video track
      const sender = peerConnection.current
        .getSenders()
        .find((s) => s.track && s.track.kind === "video");
      if (sender) {
        sender.replaceTrack(screenTrack);
      }

      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);

      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(
          JSON.stringify({
            type: "offer",
            offer,
            from: you.id,
            to: selectedUser.id,
          })
        );
      } else {
        console.warn("WebSocket is not ready, cannot send offer");
      }

      // Show screen locally
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
      }

      // When user stops screen sharing
      screenTrack.onended = async () => {
        console.log("Screen sharing stopped, switching back to camera");
        await switchBackToCamera();
      };
    } catch (err) {
      console.error("Error starting screen share:", err);
    }
  };

  const switchBackToCamera = async () => {
    try {
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      const cameraTrack = cameraStream.getVideoTracks()[0];
      const sender = peerConnection.current
        .getSenders()
        .find((s) => s.track && s.track.kind === "video");
      if (sender) {
        sender.replaceTrack(cameraTrack);
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = cameraStream;
      }
    } catch (err) {
      console.error("Error switching back to camera:", err);
    }
  };

  const stopScreenShare = () => {
    const stream = localVideoRef.current.srcObject;
    if (stream) {
      const screenTrack = stream.getVideoTracks()[0];
      if (screenTrack && screenTrack.kind === "video") {
        screenTrack.stop(); // this triggers the onended event
      }
    }
  };

  const handleSend = () => {
    if (
      (!message.trim() && selectedFiles.length === 0) ||
      !ws.current ||
      ws.current.readyState !== WebSocket.OPEN
    ) {
      return;
    }

    // Send text message if present
    if (message.trim()) {
      const payload = {
        Message: message,
        localId: Date.now(),
      };

      setChatMessages((prev) => [
        ...prev,
        {
          content: message,
          from: "sender",
          timestamp: new Date().toISOString(),
          localId: payload.localId,
        },
      ]);

      ws.current.send(JSON.stringify(payload));
      setMessage("");
    }

    // Handle file upload if files selected
    if (selectedFiles.length > 0) {
      uploadFiles();
    }
  };
  const handleGroupSend = async () => {
    if (
      (!groupInput.trim() && selectedFiles.length === 0) ||
      !selectedGroupId
    ) {
      return;
    }

    const payload = new FormData();
    payload.append("content", groupInput);
    payload.append("group", selectedGroupId); // ✅ correct key
    payload.append("sender", you.id); // ✅ required by backend

    selectedFiles.forEach((file) => {
      payload.append("files", file);
    });

    try {
      // Optimistically update UI
      setGroupMessages((prev) => [
        ...prev,
        {
          content: groupInput,
          sender: you.id, // Needed for rendering
          timestamp: new Date().toISOString(),
          files: selectedFiles.map((file) => ({
            url: URL.createObjectURL(file),
            name: file.name,
          })),
        },
      ]);

      await axios.post("http://127.0.0.1:8000/group/send-message/", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setGroupInput("");
      setSelectedFiles([]);
    } catch (error) {
      console.error("Failed to send group message:", error);
    }
  };

  useEffect(() => {
    if (!selectedGroupId || !token) return;

    const fetchGroupMessages = async () => {
      try {
        const res = await axios.get(
          `http://127.0.0.1:8000/group/messages/${selectedGroupId}/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setGroupMessages(res.data);
      } catch (err) {
        console.error("Error fetching group messages:", err);
      }
    };

    fetchGroupMessages();
  }, [selectedGroupId]);

  const uploadFiles = async () => {
    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append("file", file);
      formData.append("content", file.name);
    });
    formData.append("sender", you.id);
    formData.append("receiver", selectedUser.id);

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/upload-files/",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const uploadedFiles = response.data.files || [];
      const timestamp = response.data.message.timestamp;
      const messageId = response.data.message.id;

      uploadedFiles.forEach((fileObj) => {
        const fileUrl = fileObj.file;
        console.log(fileUrl);

        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
          ws.current.send(
            JSON.stringify({
              type: "file",
              file_url: fileUrl,
              fileName: fileObj.file.split("/").pop(),
              sender: you.id,
              receiver: selectedUser.id,
              timestamp: timestamp,
              message_id: messageId,
            })
          );
        }

        setChatMessages((prev) => [
          ...prev,
          {
            id: messageId,
            file_url: fileUrl,
            fileName: fileObj.file.split("/").pop(),
            from: "sender",
            to: selectedUser.id,
            timestamp: timestamp,
          },
        ]);
      });

      setSelectedFiles([]);
      setPreviewUrls([]);
    } catch (err) {
      console.error("File upload failed", err);
      alert("File upload failed. Please try again.");
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles((prevFiles) => [...prevFiles, ...files]);

    const urls = files.map((file) =>
      file.type.startsWith("image/") || file.type === "application/pdf"
        ? URL.createObjectURL(file)
        : null
    );
    setPreviewUrls((prevUrls) => [...prevUrls, ...urls]);
    e.target.value = null;
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSend();
  };

  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : "";
  };

  const handleEmojiClick = (emojiData) => {
    setMessage(message + emojiData.emoji);
  };

  const sendChatMessage = async ({
    content = "",
    voice_message,
    file = [],
  }) => {
    const formData = new FormData();
    formData.append("sender", you.id);
    formData.append("receiver", selectedUser.id);
    if (content) formData.append("content", content);
    if (voice_message) formData.append("voice_message", voice_message);

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/send/",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setChatMessages((prev) => [...prev, response.data]);
    } catch (err) {
      console.error("Send failed", err);
      alert("Send failed");
    }
  };

  const handleVoiceClick = async () => {
    if (recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/webm",
          });
          const voiceFile = new File([audioBlob], "voice_message.webm", {
            type: "audio/webm",
          });
          await sendChatMessage({
            content: "",
            voice_message: voiceFile,
            files: [],
          });
        };

        mediaRecorder.start();
        setRecording(true);
      } catch (err) {
        console.error("Mic error:", err);
      }
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/get_signup/");
      setUsers(res.data);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const toggleUser = (id) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    );
  };
  useEffect(() => {
    if (you?.id && token) {
      axios
        .get(`http://127.0.0.1:8000/get-group-user/${you.id}/`)
        .then((res) => setGroupList(res.data))
        .catch((err) => console.error("Error fetching group list:", err));
    }
  }, [you, token]);

  const createGroup = async () => {
    try {
      const allMembers = [...selectedMembers, you.id];

      const uniqueMembers = [...new Set(allMembers)];

      const payload = {
        name: groupName,
        members: uniqueMembers,
      };

      const res = await axios.post(
        "http://127.0.0.1:8000/groupcreate/",
        payload
      );

      setGroupList((prev) => [...prev, res.data]);
      setShowModal(false);
      setGroupName("");
      setSelectedMembers([]);
    } catch (err) {
      console.error("Error creating group:", err);
    }
  };

  const getInitialgroup = (name) => {
    if (!name) return "";
    return name.charAt(0).toUpperCase();
  };

  const renderRightPanelContent = () => {
    if (activeTab === 0) {
      return (
        <div className={style.chatmessagescontainer}>
          {chatMessages.map((msg, index) => (
            <div
              key={index}
              className={
                msg.from === "receiver" ? style.leftmessage : style.rightmessage
              }
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems:
                    msg.from === "receiver" ? "flex-end" : "flex-start",
                  gap: "5px",
                }}
              >
                {msg.voice_url && (
                  <audio controls style={{ width: "200px" }}>
                    <source
                      src={`http://127.0.0.1:8000${msg.voice_url}`}
                      type="audio/webm"
                    />
                  </audio>
                )}

                {msg.files && msg.files.length > 0 ? (
                  <div
                    style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}
                  >
                    {msg.files.map((file, idx) => {
                      const fullUrl = `http://127.0.0.1:8000${file.url}`;
                      const isImage = file.url.match(
                        /\.(jpeg|jpg|png|gif|webp)$/i
                      );
                      const isPDF = file.url.match(/\.pdf$/i);
                      const isDoc = file.url.match(/\.(doc|docx)$/i);

                      return (
                        <a
                          key={idx}
                          href={fullUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ textDecoration: "none", color: "blue" }}
                        >
                          {isImage ? (
                            <img
                              src={fullUrl}
                              alt={file.name || "uploaded file"}
                              style={{
                                maxWidth: "200px",
                                maxHeight: "200px",
                                borderRadius: "8px",
                              }}
                            />
                          ) : isPDF ? (
                            <div
                              style={{
                                width: "150px",
                                height: "200px",
                                border: "1px solid #ccc",
                                borderRadius: "8px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexDirection: "column",
                                background: "#f9f9f9",
                              }}
                            >
                              <img
                                src="https://upload.wikimedia.org/wikipedia/commons/8/87/PDF_file_icon.svg"
                                alt="PDF"
                                style={{ width: "50px", height: "50px" }}
                              />
                              <span
                                style={{
                                  fontSize: "12px",
                                  textAlign: "center",
                                }}
                              >
                                {file.name}
                              </span>
                            </div>
                          ) : isDoc ? (
                            <div
                              style={{
                                width: "150px",
                                height: "200px",
                                border: "1px solid #ccc",
                                borderRadius: "8px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexDirection: "column",
                                background: "#f9f9f9",
                              }}
                            >
                              <img
                                src="https://upload.wikimedia.org/wikipedia/commons/4/4f/Microsoft_Word_2013_logo.svg"
                                alt="DOC"
                                style={{ width: "50px", height: "50px" }}
                              />
                              <span
                                style={{
                                  fontSize: "12px",
                                  textAlign: "center",
                                }}
                              >
                                {file.name}
                              </span>
                            </div>
                          ) : (
                            <span>{file.name || "View File"}</span>
                          )}
                        </a>
                      );
                    })}
                  </div>
                ) : msg.file_url ? (
                  <a
                    href={msg.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: "none", color: "blue" }}
                  >
                    {msg.file_url.match(/\.(jpeg|jpg|png|gif|webp)$/i) ? (
                      <img
                        src={msg.file_url}
                        alt={msg.fileName || "uploaded file"}
                        style={{
                          maxWidth: "200px",
                          maxHeight: "200px",
                          borderRadius: "8px",
                        }}
                      />
                    ) : (
                      <span>{msg.fileName || "View File"}</span>
                    )}
                  </a>
                ) : null}

                {/* Display message content if present */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "12px",
                  }}
                >
                  {msg.content && (
                    <p style={{ fontSize: "14px" }}>{msg.content}</p>
                  )}
                  <span>
                    {new Date(msg.timestamp || Date.now()).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }
    if (activeTab === 1) {
      return (
        <div className={style.chatmessagescontainer}>
          {groupMessages.map((msg, index) => {
            const isSender = msg.sender === you.id;

            return (
              <div
                key={index}
                className={isSender ? style.rightmessage : style.leftmessage}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: isSender ? "flex-start" : "flex-end",
                    gap: "5px",
                  }}
                >
                  {!isSender && (
                    <span
                      style={{
                        fontWeight: "bold",
                        fontSize: "13px",
                        color: "#555",
                      }}
                    >
                      {msg.sender_username}
                    </span>
                  )}

                  {msg.voice_url && (
                    <audio controls style={{ width: "200px" }}>
                      <source
                        src={`http://127.0.0.1:8000${msg.voice_url}`}
                        type="audio/webm"
                      />
                    </audio>
                  )}

                  {msg.files && msg.files.length > 0 ? (
                    <div
                      style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}
                    >
                      {msg.files.map((file, idx) => {
                        const fullUrl = `http://127.0.0.1:8000${file.url}`;
                        const isImage = file.url.match(
                          /\.(jpeg|jpg|png|gif|webp)$/i
                        );
                        const isPDF = file.url.match(/\.pdf$/i);
                        const isDoc = file.url.match(/\.(doc|docx)$/i);

                        return (
                          <a
                            key={idx}
                            href={fullUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ textDecoration: "none", color: "blue" }}
                          >
                            {isImage ? (
                              <img
                                src={fullUrl}
                                alt={file.name || "uploaded file"}
                                style={{
                                  maxWidth: "200px",
                                  maxHeight: "200px",
                                  borderRadius: "8px",
                                }}
                              />
                            ) : isPDF ? (
                              <div
                                style={{
                                  width: "150px",
                                  height: "200px",
                                  border: "1px solid #ccc",
                                  borderRadius: "8px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexDirection: "column",
                                  background: "#f9f9f9",
                                }}
                              >
                                <img
                                  src="https://upload.wikimedia.org/wikipedia/commons/8/87/PDF_file_icon.svg"
                                  alt="PDF"
                                  style={{ width: "50px", height: "50px" }}
                                />
                                <span
                                  style={{
                                    fontSize: "12px",
                                    textAlign: "center",
                                  }}
                                >
                                  {file.name}
                                </span>
                              </div>
                            ) : isDoc ? (
                              <div
                                style={{
                                  width: "150px",
                                  height: "200px",
                                  border: "1px solid #ccc",
                                  borderRadius: "8px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexDirection: "column",
                                  background: "#f9f9f9",
                                }}
                              >
                                <img
                                  src="https://upload.wikimedia.org/wikipedia/commons/4/4f/Microsoft_Word_2013_logo.svg"
                                  alt="DOC"
                                  style={{ width: "50px", height: "50px" }}
                                />
                                <span
                                  style={{
                                    fontSize: "12px",
                                    textAlign: "center",
                                  }}
                                >
                                  {file.name}
                                </span>
                              </div>
                            ) : (
                              <span>{file.name || "View File"}</span>
                            )}
                          </a>
                        );
                      })}
                    </div>
                  ) : msg.file_url ? (
                    <a
                      href={msg.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: "none", color: "blue" }}
                    >
                      {msg.file_url.match(/\.(jpeg|jpg|png|gif|webp)$/i) ? (
                        <img
                          src={msg.file_url}
                          alt={msg.fileName || "uploaded file"}
                          style={{
                            maxWidth: "200px",
                            maxHeight: "200px",
                            borderRadius: "8px",
                          }}
                        />
                      ) : (
                        <span>{msg.fileName || "View File"}</span>
                      )}
                    </a>
                  ) : null}

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "12px",
                    }}
                  >
                    {msg.content && (
                      <p style={{ fontSize: "14px" }}>{msg.content}</p>
                    )}
                    <span>
                      {new Date(
                        msg.timestamp || Date.now()
                      ).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    if (activeTab === "post") {
      return (
        <div style={{ padding: 20 }}>
          <h2>Post</h2>
          {selectedUser ? (
            <p>
              Here you can display shared files with {selectedUser.username}.
            </p>
          ) : (
            <p>Please select a user to view files.</p>
          )}
        </div>
      );
    }

    if (activeTab === "files") {
      return (
        <div style={{ padding: 20 }}>
          <h2>Files</h2>
          {selectedUser ? (
            <p>
              Here you can display shared files with {selectedUser.username}.
            </p>
          ) : (
            <p>Please select a user to view files.</p>
          )}
        </div>
      );
    }

    if (activeTab === "photos") {
      return (
        <div style={{ padding: 20 }}>
          <h2>Photos</h2>
          {selectedUser ? (
            <p>
              Here you can display shared photos with {selectedUser.username}.
            </p>
          ) : (
            <p>Please select a user to view photos.</p>
          )}
        </div>
      );
    }

    return null;
  };

  const handleFriendRequestClick = () => {
    if (!you?.id) return;

    axios
      .get(`http://127.0.0.1:8000/friend-request/${you.id}/`)
      .then((res) => {
        setRequestedUsers(res.data); // res.data contains user objects
        setShowFriendRequestModal(true);
      })
      .catch((err) => {
        console.error("Error fetching friend requests", err);
      });
  };

  const handleFriendRequestAction = (userId, action) => {
    console.log(`${action.toUpperCase()} friend request for user ID ${userId}`);
  };

  const FriendRequestAccept = (userId) => {
    axios
      .post(`http://127.0.0.1:8000/accept-friend-request/`, {
        receiver_id: you.id,
        sender_id: userId,
      })
      .then((res) => {
        console.log("Friend request accepted:", res.data);
        setRequestedUsers((prev) => prev.filter((user) => user.id !== userId));
        setShowFriendRequestModal(false);
      })
      .catch((err) => {
        console.error("Error accepting friend request", err);
      });
  };

  return (
    <div className={style.chatcontainer}>
      {/* Left panel - User list */}
      <div
        className={`${style.chatheader} ${isMobile && activeView === "right" ? style.hideMobile : ""
          }`}
      >
        {/* <div className={style.chatheader}> */}
        <div className={style.chattopheader}>
          <h3>Chat</h3>
          <div className={style.chatheadericons}>
            <div className={style.cornericon} title="Filter">
              <IoFilter />
            </div>
            <div
              className={style.cornericon}
              title="Meet Now"
              onClick={startScreenShare}
            >
              <IoVideocamOutline />
            </div>
            <div
              className={style.cornericon}
              title="New Chat"
              onClick={() => {
                setShowModal(true);
                fetchUsers();
              }}
            >
              <MdOpenInNew />
            </div>
          </div>
        </div>
        {showModal && (
          <div className={style.modalOverlay}>
            <div className={style.modalContent}>
              <h2>Create Group</h2>

              <input
                type="text"
                placeholder="Enter group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className={style.inputBox}
              />

              <div className={style.userList}>
                {users
                  .filter((u) => u.username !== loggedInUsername)
                  .map((user) => (
                    <div
                      key={user.id}
                      className={`${style.userItem} ${selectedMembers.includes(user.id) ? style.selected : ""
                        }`}
                      onClick={() => toggleUser(user.id)}
                    >
                      {user.username}
                    </div>
                  ))}
              </div>

              <div className={style.modalActions}>
                <button onClick={createGroup}>Create</button>
                <button onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
        {/* Display users */}
        {userList
          .filter((user) => user.username !== loggedInUsername)
          .map((user, index) => (
            <div
              key={index}
              className={style.chatbusniesscontainer}
              onClick={() => {
                dispatch(setSelectedUser(user));
                setActiveTab(0);
                setActiveView("right");
              }}
              style={{
                cursor: "pointer",
                backgroundColor:
                  selectedUser?.username === user.username
                    ? "rgba(47, 46, 46, 0.834)"
                    : "transparent",
              }}
            >
              <div className={style.chatbusineesheader}>
                <div className={style.chatbusinessicons}>
                  <div className={style.circle}>
                    {getInitial(user.username)}
                  </div>
                </div>
                <h3>{user.username}</h3>
              </div>
              <div className={style.chatbusinesssecondicon} title="Options">
                <BiDotsHorizontal />
              </div>
            </div>
          ))}
        {groupList.map((group, index) => (
          <div
            key={`group-${index}`}
            className={style.chatbusniesscontainer}
            onClick={() => {
              dispatch(setSelectedUser({ ...group, isGroup: true }));
              setActiveTab(1);
              setSelectedGroupId(group.id);
              setActiveView("right");
            }}
            style={{
              cursor: "pointer",
              backgroundColor:
                selectedUser?.id === group.id && selectedUser?.isGroup
                  ? "rgba(47, 46, 46, 0.834)"
                  : "transparent",
            }}
          >
            <div className={style.chatbusineesheader}>
              <div className={style.chatbusinessicons}>
                <div className={style.circle}>
                  {getInitialgroup(group.name)}
                </div>
              </div>
              <h3>{group.name}</h3>
            </div>
            <div className={style.chatbusinesssecondicon} title="Options">
              <BiDotsHorizontal />
            </div>
          </div>
        ))}
      </div>
      {/* </div> */}

  {/* Right panel - Chat Area */}
      <div className={`${style.chatrightside} ${activeView === "right" ? style.showMobile : ""}`}>
        {/* <div className={style.chatrightside}> */}
        {/* BACK BUTTON (MOBILE) */}
        <div
          className={style.mobileBack}
          onClick={() => setActiveView("left")}
        >
          <IoArrowBack /> Back
        </div>
        <div className={style.chatrighttopcontainer}>
          <div className={style.chatnavcontaineleft}>
            <div className={style.chattopbusineesheader}>
              <div className={style.chattopbusinessicons}>
                <div className={style.circle}>
                  {getInitial(selectedUser?.username)}
                </div>
              </div>
              <h3>{selectedUser ? selectedUser.username : "Select a user"}</h3>
            </div>

            {/* Tabs for Post, Files, Photos */}
            <div
              className={style.chatparanav}
              onClick={() => setActiveTab("post")}
              style={{
                cursor: "pointer",
                borderBottom:
                  activeTab === "post" ? "2px solid #0b93f6" : "none",
                fontWeight: activeTab === "post" ? "bold" : "normal",
              }}
            >
              <p>Post</p>
            </div>
            <div
              className={style.chatparanav}
              onClick={() => setActiveTab("files")}
              style={{
                cursor: "pointer",
                borderBottom:
                  activeTab === "files" ? "2px solid #0b93f6" : "none",
                fontWeight: activeTab === "files" ? "bold" : "normal",
              }}
            >
              <p>Files</p>
            </div>
            <div
              className={style.chatparanav}
              onClick={() => setActiveTab("photos")}
              style={{
                cursor: "pointer",
                borderBottom:
                  activeTab === "photos" ? "2px solid #0b93f6" : "none",
                fontWeight: activeTab === "photos" ? "bold" : "normal",
              }}
            >
              <p>Photos</p>
            </div>
          </div>

          <div className={style.chatnavcontainerright}>
            <div className={style.navbariconsleft}>
              <div
                className={style.finaliconsnavbar}
                title="Video Call"
                onClick={startCall}
              >
                <FaVideo />
              </div>
              <div className={style.finaliconsnavbar} title="Voice Call">
                <IoCall />
              </div>
              <div
                className={style.finaliconsnavbar}
                title="Friend Request"
                onClick={handleFriendRequestClick}
              >
                <MdGroupAdd />
              </div>
            </div>
          </div>

          {incomingCall && (
            <div className={style.incomingCallPopup}>
              <p>📞 Incoming video call...</p>
              <button onClick={acceptCall}>Accept</button>
              <button onClick={rejectCall}>Reject</button>
            </div>
          )}

          {calling && (
            <div className={style.videoContainer}>
              <video
                ref={localVideoRef}
                autoPlay
                muted
                className={style.localVideo}
              ></video>
              <video
                ref={remoteVideoRef}
                autoPlay
                className={style.remoteVideo}
              ></video>
              <div className={style.videooverall}>
                <button onClick={endCall} className={style.endCallButton}>
                  End Call
                </button>
                <div
                  className={style.sharebutton}
                  title="Meet Now"
                  onClick={startScreenShare}
                >
                  <IoVideocamOutline />
                </div>
              </div>

              {/* <div className={style.stopbutton} title="Stop" onClick={stopScreenShare}>
              <MdStopCircle style={{ color: "red", fontSize: "14px" }} />
          </div> */}
            </div>
          )}

          {/* Friend Request Modal */}
          {showFriendRequestModal && (
            <div className={style.modalOverlay}>
              <div className={style.modalContent}>
                <div className={style.modalHeader}>
                  <h2>Sent Friend Requests</h2>
                  <IoClose
                    className={style.closeIcon}
                    onClick={() => setShowFriendRequestModal(false)}
                  />
                </div>
                {requestedUsers.length === 0 ? (
                  <p style={{ marginTop: "10px" }}>
                    No friend requests sent yet.
                  </p>
                ) : (
                  requestedUsers.map((user) => (
                    <div key={user.id} className={style.modalUserRow}>
                      <div className={style.modalUserIcon}>
                        <span>{user.username}</span>
                      </div>
                      <div className={style.modalUserActions}>
                        <div
                          className={style.acceptButton}
                          onClick={() => FriendRequestAccept(user.id, "accept")}
                        >
                          <RiCheckboxCircleLine />
                        </div>
                        <div
                          className={style.declineButton}
                          onClick={() =>
                            handleFriendRequestAction(user.id, "decline")
                          }
                        >
                          <IoCloseSharp />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        <div className={style.chatcontentarea}>{renderRightPanelContent()}</div>

        {/* Show input box only if active tab is "post" */}

        {activeTab === 0 && selectedUser && (
          <div className={style.chatinput}>
            <input
              type="text"
              placeholder="Type a Message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <div className={style.chatinputicons}>
              <div
                className={style.chatemojiicon}
                title="Emoji"
                onClick={() => setShowPicker(!showPicker)}
              >
                <MdEmojiEmotions />
              </div>
              <div
                className={style.chatemojiicon}
                title="Voice Message"
                style={{ cursor: "pointer" }}
                onClick={handleVoiceClick}
              >
                {recording ? (
                  <MdStopCircle style={{ color: "red", fontSize: "14px" }} />
                ) : (
                  <MdOutlineSettingsVoice style={{ fontSize: "18px" }} />
                )}
              </div>
              <div className={style.chatemojiicon} title="Insert Photo">
                <MdInsertPhoto />
              </div>
              <div className={style.chatemojiicon} title="Attach Link">
                <BsLink45Deg />
              </div>
              <div
                className={style.chatemojiicon}
                title="Add File"
                onClick={() => fileInputRef.current.click()}
              >
                <IoAdd />
              </div>
              <div
                className={style.specialicon}
                onClick={handleSend}
                title="Send Message"
              >
                <IoSendSharp />
              </div>
            </div>
            {showPicker && (
              <div className={style.emojiPickerContainer}>
                <EmojiPicker onEmojiClick={handleEmojiClick} />
              </div>
            )}
          </div>
        )}

        {activeTab === 1 && selectedGroupId && (
          <div className={style.chatinput}>
            <input
              type="text"
              placeholder="Type a group message"
              value={groupInput}
              onChange={(e) => setGroupInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleGroupSend();
              }}
            />
            <div className={style.chatinputicons}>
              <div
                className={style.chatemojiicon}
                title="Emoji"
                onClick={() => setShowPicker(!showPicker)}
              >
                <MdEmojiEmotions />
              </div>
              <div
                className={style.chatemojiicon}
                title="Voice Message"
                style={{ cursor: "pointer" }}
                onClick={handleVoiceClick}
              >
                {recording ? (
                  <MdStopCircle style={{ color: "red", fontSize: "14px" }} />
                ) : (
                  <MdOutlineSettingsVoice style={{ fontSize: "18px" }} />
                )}
              </div>
              <div className={style.chatemojiicon} title="Insert Photo">
                <MdInsertPhoto />
              </div>
              <div className={style.chatemojiicon} title="Attach Link">
                <BsLink45Deg />
              </div>
              <div
                className={style.chatemojiicon}
                title="Add File"
                onClick={() => fileInputRef.current.click()}
              >
                <IoAdd />
              </div>
              <div
                className={style.specialicon}
                onClick={handleGroupSend}
                title="Send Message"
              >
                <IoSendSharp />
              </div>
            </div>

            {showPicker && (
              <div
                style={{
                  position: "absolute",
                  zIndex: 1000,
                  marginLeft: "500px",
                  marginBottom: "500px",
                }}
              >
                <EmojiPicker onEmojiClick={handleEmojiClick} />
              </div>
            )}
          </div>
        )}

        <input
          type="file"
          multiple
          id="chatFileInput"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
        />

        {selectedFiles.length > 0 && (
          <div className={style.previewSection}>
            <div className={style.previewList}>
              {selectedFiles.map((file, index) => (
                <div key={index} className={style.previewItem}>
                  {file.type.startsWith("image/") && previewUrls[index] ? (
                    <div>
                      <img
                        src={previewUrls[index]}
                        alt="preview"
                        className={style.previewImage}
                      />
                      <button type="button" onClick={() => setPopupFile(file)}>
                        👁
                      </button>
                    </div>
                  ) : (
                    <div>
                      <span>{file.name}</span>
                      <button type="button" onClick={() => setPopupFile(file)}>
                        👁
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {popupFile && (
          <div className={style.popupOverlay}>
            <div className={style.popupContent}>
              <button
                onClick={() => setPopupFile(null)}
                className={style.closeButton}
              >
                <IoCloseCircle size={24} />
              </button>

              {popupFile.type.startsWith("image/") ? (
                <img
                  src={URL.createObjectURL(popupFile)}
                  alt="Full Preview"
                  className={style.popupImage}
                />
              ) : popupFile.type === "application/pdf" ? (
                <iframe
                  src={URL.createObjectURL(popupFile)}
                  title="PDF Preview"
                  className={style.popupIframe}
                />
              ) : (
                <div style={{ textAlign: "center" }}>
                  <p>Preview not supported for this file type.</p>
                  <a
                    href={URL.createObjectURL(popupFile)}
                    download={popupFile.name}
                    className={style.downloadButton}
                  >
                    Download file
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
