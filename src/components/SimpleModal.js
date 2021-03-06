import React, { useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Modal from '@material-ui/core/Modal';
import { Filter } from './Filter';
import ClassList from './ClassList';
import firebase from 'firebase';
import { ReactComponent as Offline } from './offline.svg';
import { ReactComponent as StudyAlone } from './studyalone.svg';
import { ReactComponent as StudyOthers } from './studywithothers.svg';
import plus from '../components/plus.png';
import back from '../components/back-icon.png';
import trashPic from '../components/trash.png';

const db = firebase.firestore();

const colors = ["yellow", "blue", "purple", "orange", "pink"]

const useStyles = makeStyles((theme) => ({
    paper: {
      position: 'absolute',
      width: 400,
      height: 400,
      backgroundColor: theme.palette.background.paper,
      border: '2px solid #000',
      boxShadow: theme.shadows[5],
      padding: theme.spacing(2, 4, 3),
      overflowY: 'scroll'
    },
  }));
  
  function rand() {
    return Math.round(Math.random() * 20) - 10;
  }
  
  function getModalStyle() {
    const top = 50 + rand();
    const left = 50 + rand();
  
    return {
      top: `${top}%`,
      left: `${left}%`,
      transform: `translate(-${top}%, -${left}%)`,
    };
  }
  
  export default function SimpleModal() {
    const styles = useStyles();
    // getModalStyle is not a pure function, we roll the style only on the first render
    const [modalStyle] = React.useState(getModalStyle);
    const [open, setOpen] = React.useState(false);

    const [word, setWord] = React.useState('');

    let classesRef = db.collection('classes');
    

    const [classesList, setClassList] = React.useState([]);
    const [userList, setUserList] = React.useState([]);
    const [studentList, setStudentList] = React.useState([]);
    const [classTitle, setClassTitle] = React.useState(null);

    const [trash, setTrash] = React.useState(false);
    const [selectedClassName, setSelectedClassName] = React.useState(null);

    const [studentModal, setStudentModal] = React.useState(false);



    let temp = [];

    let classListTemp = [];

    
    
    useEffect(() => {
      let curr = firebase.auth().currentUser.uid;
      let acquireData = db.collection('users').doc(curr).get()
      .then(doc => {
        if (!doc.exists) {
          console.log('doc does not exist');
        } else {
          let data = doc.data();
          if (typeof data.classes !== 'undefined') {
            temp = data.classes.slice();
          } else {
            db.collection('users').doc(curr).update({classes: []});
          }
          setUserList(temp);
        }
      })
      .catch(err => {
        console.log('unable to retrieve document', err);
      });

      // query class list for display
      let query = classesRef.get()
      .then(snapshot => {
        snapshot.forEach(doc => {
          classListTemp.push({name: doc.id});
        });
        setClassList(classListTemp);
      })
      .catch(err => {
        console.log('error getting docs', err);
      });


    });

    let filteredList = classesList.filter(
      (className) => {
        return className.name.toLowerCase().indexOf(word.toLowerCase()) !== -1;
      }
    );

    const handleChange = e => {
      setWord(e.substr(0, 20));
    };
  
    const handleOpen = () => {
      setOpen(true);
    };
  
    const handleClose = () => {
      setOpen(false);
    };

    function handleClassCloaseClick() {
      setStudentModal(false);
    }

    function handleClassClick(t) {
      let students = [];
      let currentUser = firebase.auth().currentUser.uid;
      let acquireData = db.collection('classes').doc(t).get()
      .then(doc => {
        if (!doc.exists) {
          console.log('doc does not exist');
        } else {
          let data = doc.data().users.slice(); 
          let acquireData = db.collection('users');
          data.map(student => {
            acquireData.doc(student).get()
            .then(doc => {
            if (!doc.exists) {
                console.log('doc does not exist');
            } else {
                let a = doc.data();
                console.log("doc", doc);
                console.log("currentUser", currentUser);
                if (doc.id !== currentUser) {
                  console.log(doc.id);
                  setStudentList(studentList => studentList.concat(a));
                }
                console.log("studetns list", studentList);
              }
            })
            .catch(err => {
                console.log('unable to retrieve document', err);
            });
          });  
        }
      })
      .catch(err => {
        console.log('unable to retrieve document', err);
      });
   
      setStudentModal(true);
      setClassTitle(t);
    };

    function handleStatusClick(s, nameOfClass) {
      let curr = firebase.auth().currentUser.uid;
      let userListCopy = userList.slice();
      for (let i = 0; i < userListCopy.length; i++) {
        if (userListCopy[i].name === nameOfClass) {
          if (s === 'offline') {
            userListCopy[i].status = 'study with others';
          } else if (s === 'study with others') {
            userListCopy[i].status = 'study alone';
          } else {  
            userListCopy[i].status = 'offline';
          }
          db.collection('users').doc(curr).update({classes: userListCopy});
          setUserList(userListCopy);
          break;
        }
      }
    }

    function handleTrashClick(name) {
      setOpen(true);
      setTrash(true);
      setSelectedClassName(name);
    }

    function handleDeleteClick(name) {
      setOpen(false);
      setTrash(false);
      let curr = firebase.auth().currentUser.uid;
      let userListCopy = userList.slice();
      let storage = [];
      for (let i = 0; i < userListCopy.length; i++) {
        if (userListCopy[i].name !== name) {
          storage.push(userListCopy[i]);
        }
      }
      db.collection('users').doc(curr).update({classes: storage});
      let getData = db.collection('classes').doc(name).get()
      .then(doc => {
        if (!doc.exists) {
          console.log('doc doesnt exist');
        } else {
          let copy = doc.data().users.slice();
          let userIndex = copy.indexOf(curr);
          if (userIndex > -1) {
            copy.splice(userIndex, 1);
          }
          db.collection('classes').doc(name).update({users: copy});
        }
      })
      .catch(err => {
        console.log('error reaching', err);
      });
      setUserList(storage);
    }

    function getStatusOfClass(nameOfClass, studentClassList) {
      for (let i = 0; i < studentClassList.length; i++) {
        if (nameOfClass === studentClassList[i].name) {
          return studentClassList[i].status;
        }
      }
    }

  
    const body = (
        <div style={modalStyle} className={styles.paper}>
          {trash ? 
              <div>Do you really want to delete {selectedClassName}? 
                 <button onClick={handleDeleteClick.bind(this, selectedClassName)}>
                   Yes, Delete
                  </button>
                  <button onClick={()=>{setOpen(false); setTrash(false);}}>
                   No, Cancel
                  </button>
              </div>
               
          : 
            <div>
            <Filter value={word} handleChange={e=>handleChange(e.target.value)}/>
            <ClassList classes={word.length < 1 ? classesList : filteredList} userClasses={userList}/>
            <button type="button" onClick={handleClose}>
                Close
            </button>
            </div>
          }
      </div>
      
    );

    const curr = firebase.auth().currentUser.uid;
  
    return (
      <div >
        {studentModal ? 
          <div className="classes">
          <div class="classes-header">
          <h1 style={{ float: 'left'}}> Students from {classTitle}</h1>
            <button class="back-button" style={{backgroundColor: 'none'}} onClick={handleClassCloaseClick.bind()}>
            <img src={back} style={{ width: 'inherit', height: 'inherit', margin:'auto'}}/>
            </button>
          </div>
          <div className="students-list">
            {studentList.map((studentName, i) => (
                          <div class="students-button"> 
                            <div class="status-button">
                            {(getStatusOfClass(classTitle, studentName.classes) === 'offline') && <div>
                                <Offline />
                              </div>}
                              {(getStatusOfClass(classTitle, studentName.classes) === 'study with others') && <div>
                                <StudyOthers />
                              </div>}
                              {(getStatusOfClass(classTitle, studentName.classes) === 'study alone') && <div>
                                <StudyAlone/>
                              </div>}
                            </div>
                            <button key={i} class="students-button">
                              <img src={studentName.photoURL} alt="user profile" height='100' width='100'/>
                                <div style={{display: 'inline-block'}}>
                                  <h3 >{studentName.name}</h3>
                                  <p>{studentName.email}</p>
                                </div>
                            </button>
                          </div>
            ))}
          </div>

          </div>
        : 
          <div className="classes">
          <div className="classes-header">
            <h1 style={{ float: 'left'}}> Classes </h1>
            <button className="class-button" onClick={handleOpen}>
              <img src={plus} style={{ width: '100%', height: '90%', margin:'auto'}}/>
            </button>
          </div>
          {userList.map((classTitle, i) => (
            <div className="class-list" key={i}>
              <button key={"status"+i} class="status-button" onClick={handleStatusClick.bind(this, classTitle.status, classTitle.name)}>
                  {(classTitle.status === 'offline') && <div>
                    <Offline />
                  </div>}
                  {(classTitle.status === 'study with others') && <div>
                    <StudyOthers />
                  </div>}
                  {(classTitle.status === 'study alone') && <div>
                    <StudyAlone/>
                  </div>}
              </button>
              <button key={"class"+i} class="classes-button" onClick={handleClassClick.bind(this, classTitle.name)} style={{backgroundImage: `linear-gradient(to right, ${colors[i]} 80%, white 20%)`}}>
                    {classTitle.name}
              </button>
              <button key={"trash"+i} class="status-button" onClick={handleTrashClick.bind(this, classTitle.name)}>
                  <img src={trashPic} style={{ width: '50%', height: '50%', margin:'auto'}}/>
              </button>
            </div>
          ))}
            <div className="add-msg">Press + to add more classes</div>

          </div>
        }
          <Modal
            open={open}
            onClose={handleClose}
            aria-labelledby="simple-modal-title"
            aria-describedby="simple-modal-description"
          >
             {body}
          </Modal>
      </div>
    );
  }