import { useParams } from "react-router-dom";
import Container from "../../components/Shared/Container";
import Loader from "../../components/Shared/Loader";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import Header from "../../components/RoomDetails/Header";
import RoomInfo from "../../components/RoomDetails/RoomInfo";

const RoomDetails = () => {
    const { id } = useParams()
    const [loading, setLoading] = useState(false)
    const [room, setRoom] = useState({});

    useEffect(() => {
        setLoading(true)
        fetch('/rooms.json')
            .then(res => res.json())
            .then(data => {
                const singleRoom = data.find(room => room._id === id)
                setRoom(singleRoom)
                setLoading(false)
            });

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);
    if (loading) return <Loader />

    return (
        <Container>
            <Helmet>
                <title>{room?.title}</title>
            </Helmet>
            <div className="">

                <div className="flex flex-col gap-6">
                    <Header room={room} />
                </div>
                <div className="">
                    <RoomInfo room={room}/>
                </div>
            </div>

        </Container>
    );
};

export default RoomDetails;