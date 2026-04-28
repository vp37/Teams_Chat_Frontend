import React from "react";
import style from "../component/css/Teams.module.css";
import { IoFilter, IoSettingsOutline } from "react-icons/io5";
// import { IoMdAdd, IoMdContacts } from "react-icons/io";



const Teams = () => {
  return (
    <div className={style.teamscontainer}>
      <div className={style.teamheader}>
        <div className={style.righttopheader}>
          <h3>Activity</h3>
          <div className={style.headericons}>
            <div className={style.cornericon} title="Filter">
              <IoFilter />
            </div>
            <div className={style.cornericon} title="Add community">
              <IoSettingsOutline />
            </div>
          </div>
        </div>
        <div className={style.teamparacontainer}>
            <p>You will see @mentions, reactions and other notifications here.</p>
        </div>
      </div>

      <div className={style.teamrightside}>

      </div>
    </div>
  );
};

export default Teams;
