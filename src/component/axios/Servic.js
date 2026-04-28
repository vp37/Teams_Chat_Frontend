import AxiosInstance from '../axios/Axios'

export const signup= (userData)=>{
    return AxiosInstance.post("/api/signup/",userData)
}

export const login=(userData)=>{
    return AxiosInstance.post("/api/login/",userData)
}


export const getSignup=(userData)=>{
    return AxiosInstance.get("/api/get_signup/",userData)
}

export const SendMessage=(messageData)=>{
    return AxiosInstance.post("/send/",messageData)
}

export const Getsentmessage=(loggedInUserId)=>{
    return AxiosInstance.get(`/message/sender/${loggedInUserId}/`)
}

export const getreceivermessage=(receiverId)=>{
    return AxiosInstance.get(`/message/receiver/${receiverId}/`)
}