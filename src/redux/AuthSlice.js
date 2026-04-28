import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  token: null,
  user: null,
  friendRequests: [],
  acceptedFriends: [], // 🟢 Add this to track accepted friends
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthToken: (state, action) => {
      state.token = action.payload;
    },
    setAuthUser: (state, action) => {
      state.user = action.payload;
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.friendRequests = [];
      state.acceptedFriends = [];
    },
    setFriendRequests: (state, action) => {
      state.friendRequests = action.payload;
    },
    addAcceptedFriend: (state, action) => {
      state.acceptedFriends.push(action.payload); 
    },
  },
});

export const {
  setAuthToken,
  setAuthUser,
  logout,
  setFriendRequests,
  addAcceptedFriend,
} = authSlice.actions;

export default authSlice.reducer;
