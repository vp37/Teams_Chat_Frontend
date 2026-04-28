import { configureStore } from "@reduxjs/toolkit";
import chatReducer from "./ChatSlice";
import authReducer from "../redux/AuthSlice";
import friendRequestReducer from "./frienrequestSlice";

const store = configureStore({
  reducer: {
    chat: chatReducer,
    auth: authReducer,
    friendRequest: friendRequestReducer,
  },
});

export default store;
