// src/pages/Home.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setUserList } from "../redux/ChatSlice";
import { setFriendRequests } from "../redux/AuthSlice";
import style from "../component/css/Home.module.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Home = () => {
  const dispatch = useDispatch();
  const userList = useSelector((state) => state.chat.userList);
  const you = useSelector((state) => state.auth.user);
  const friendRequests = useSelector((state) => state.auth.friendRequests); // ✅ already sent requests

  const [requestedUsers, setRequestedUsers] = useState([]); // ✅ local for current session

  // ✅ Fetch all users
  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/api/get_signup/")
      .then((res) => dispatch(setUserList(res.data)))
      .catch((err) => console.error("Error fetching user data", err));
  }, [dispatch]);



  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : "";
  };

  const handleFollow = (userId) => {
    axios
      .post("http://127.0.0.1:8000/friend-request/", {
        sender_id: you?.id,
        receiver_id: userId,
      })
      .then((res) => {
        console.log("Friend request sent:", res.data);
        setRequestedUsers((prev) => [...prev, userId]);
        dispatch(setFriendRequests([...friendRequests, userId]));
        toast.success("Friend request sent successfully!");
      })
      .catch((err) => {
        console.error("Error sending friend request", err);
        if (err.response?.data?.detail) {
          toast.error(err.response.data.detail);
        } else {
          toast.error("Friend request already sent");
        }
      });
  };

  const filteredUsers = userList.filter((user) => user.id !== you?.id);

  // ✅ Check if request already sent (Redux or local)
  const isRequested = (userId) =>
    requestedUsers.includes(userId) || friendRequests.includes(userId);

  return (
    <div className={style.homecontainer}>
      <ToastContainer position="top-center" autoClose={3000} />
      <div className={style.homeheading}>
        <h2 className={style.heading}>People You May Know</h2>
      </div>
      <div className={style.homecontent}>
        {filteredUsers.map((user) => (
          <div key={user.id} className={style.usercard}>
            <div className={style.homebusinessicons}>
              <div className={style.circle}>{getInitial(user.username)}</div>
            </div>
            <h3>{user.username}</h3>
            <button
              className={style.followButton}
              onClick={() => handleFollow(user.id)}
              disabled={isRequested(user.id)}
            >
              {isRequested(user.id) ? "Requested" : "Follow"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
