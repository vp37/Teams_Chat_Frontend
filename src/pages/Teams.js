import React, { useState } from "react";
import style from "../component/css/Teams.module.css";
import { IoFilter, IoSettingsOutline } from "react-icons/io5";
import { IoMdAdd, IoMdContacts } from "react-icons/io";
import { Ri24HoursLine } from "react-icons/ri";
import { BiDotsHorizontal } from "react-icons/bi";
import { MdOutlineEventNote, MdOutlineLink } from "react-icons/md";
import teamIcon from "../images/Group 14124.png";

const Teams = () => {
  const [channels, setChannels] = useState(["Business"]);
  const [links, setLinks] = useState([]);
  const [activeView, setActiveView] = useState("left"); // ⭐ important

  const handleAddChannel = () => {
    const newChannelName = `Channel ${channels.length + 1}`;
    setChannels([...channels, newChannelName]);
  };

  const handleAddLink = () => {
    const newLink = `https://example.com/link${links.length + 1}`;
    setLinks([...links, newLink]);
    alert(`New link created: ${newLink}`);
  };

  return (
    <div className={style.teamscontainer}>
      
      {/* LEFT PANEL */}
      <div
        className={`${style.teamheader} ${
          activeView === "left" ? style.show : style.hide
        }`}
      >
        <div className={style.righttopheader}>
          <h3>Communities</h3>
          <div className={style.headericons}>
            <div className={style.cornericon}>
              <IoFilter />
            </div>
            <div className={style.cornericon}>
              <IoMdAdd />
            </div>
          </div>
        </div>

        {channels.map((channel, index) => (
          <div
            key={index}
            className={style.busniesscontainer}
            onClick={() => setActiveView("right")} // ⭐ switch view
          >
            <div className={style.busineesheader}>
              <div className={style.businessicons}>
                <Ri24HoursLine />
              </div>
              <h3>{channel}</h3>
            </div>
            <div className={style.businesssecondicon}>
              <BiDotsHorizontal />
            </div>
          </div>
        ))}

        <div className={style.addchannelcontainer} onClick={handleAddChannel}>
          <div className={style.channaladdicon}>
            <IoMdAdd />
          </div>
          <p>Add Channel</p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div
        className={`${style.teamrightside} ${
          activeView === "right" ? style.show : style.hide
        }`}
      >
        {/* MOBILE BACK BUTTON */}
        <div
          className={style.mobileBack}
          onClick={() => setActiveView("left")}
        >
          ← Back
        </div>

        <div className={style.righttopcontainer}>
          <div className={style.navcontaineleft}>
            <div className={style.paranav}><p>Post</p></div>
            <div className={style.paranav}><p>Files</p></div>
            <div className={style.paranav}><p>Photos</p></div>
          </div>

          <div className={style.navcontainerright}>
            <div className={style.modelcontainer}>
              <MdOutlineEventNote />
              <p>Events</p>
            </div>

            <div className={style.navbariconsleft}>
              <IoMdContacts />
              <MdOutlineLink onClick={handleAddLink} />
              <IoSettingsOutline />
            </div>
          </div>
        </div>

        <div className={style.teamimages}>
          <img src={teamIcon} alt="Team" />
          <p>Welcome to your new channel!</p>
        </div>
      </div>
    </div>
  );
};

export default Teams;