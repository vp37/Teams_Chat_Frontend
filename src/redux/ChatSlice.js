import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  userList: [],
  selectedUser: null,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setUserList: (state, action) => {
      state.userList = action.payload;
    },
    setSelectedUser: (state, action) => {
      state.selectedUser = action.payload;
    },
  },
});

export const { setUserList, setSelectedUser } = chatSlice.actions;
export default chatSlice.reducer;
