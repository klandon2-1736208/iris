import React, {Component} from "react";
import firebase from 'firebase';


const db = firebase.firestore();
  /*
  let acquireData = db.collection('users').doc(currentUser).get()
    .then(doc => {
      if (!doc.exists) {
        console.log('doc does not exist');
      } else {
        let data = doc.data();
        let temp = data.classes.slice();
        console.log(temp);
        if (!temp.includes(className) && temp.length < 4) {
          temp.push(className);
          console.log(temp);
          db.collection('users').doc(currentUser).update({classes: temp});
        }     
      }
    })
    .catch(err => {
      console.log('unable to retrieve document', err);
    });
  */

class ClassList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: this.props.classes,
      userClasses: this.props.userClasses
    };
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(className) {
    let currentUser = firebase.auth().currentUser.uid;
    let userClassListCopy = this.state.userClasses.slice();
    if (!userClassListCopy.includes(className) && userClassListCopy.length < 4) {
      userClassListCopy.push(className);
      this.setState({userClasses: userClassListCopy});
      db.collection('users').doc(currentUser).update({classes: userClassListCopy});
    }
  }

  render() {
    let classCopy = this.state.classes.slice();
    return (
      <div>
        <h1>Classes</h1>
        {classCopy.map((classTitle, i) => (
          <div key={i}>
            <ul>
              {classTitle.name}<button onClick={this.handleClick(classTitle.name)}>Add</button>
            </ul>
          </div>
        ))}
      </div>
    );
  }
}

export default ClassList;