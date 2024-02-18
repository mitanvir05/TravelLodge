import axiosSecure from "."

//fetch all rooms from db

export const getAllRooms = async()=>{
    const {data} = await axiosSecure('/rooms')
    return(data)
} 
//fetch single rooms from db

export const getRoom = async id=>{
    const {data} = await axiosSecure(`/room/${id}`)
    return(data)
} 