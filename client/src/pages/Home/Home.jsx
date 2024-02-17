import { Helmet } from "react-helmet-async"
import Categories from "../../components/Categories/Categories"
import Rooms from "../../components/Rooms/Rooms"

const Home = () => {
  
  return (
    <div>
      <Helmet>
                <title>Travel Lodge</title>
            </Helmet>
      {/* Category section */}
      <Categories/>
      {/* Rooms section */}
      <Rooms></Rooms>
    </div>
  )
}

export default Home
