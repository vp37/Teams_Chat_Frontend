import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  requests: [],
  loading: false,
  error: null,
};

const friendRequestSlice = createSlice({
  name: "friendRequest",
  initialState,
  reducers: {
    setFriendRequests(state, action) {
      state.requests = action.payload;
      state.loading = false;
      state.error = null;
    },
    addFriendRequest(state, action) {
      state.requests.push(action.payload);
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
    setError(state, action) {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { setFriendRequests, addFriendRequest, setLoading, setError } = friendRequestSlice.actions;
export default friendRequestSlice.reducer;
