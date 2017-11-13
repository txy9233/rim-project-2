// move the given player according to the key passed in
function movePlayer (key, playerObject) {
  switch(key){
    case 'w':
      playerObject.body.velocity.y = -200;
      break;
    case 'a':
      playerObject.body.velocity.x = -200;
      break;
    case 's':
      playerObject.body.velocity.x = 200;
      break;
    case 'd':
      playerObject.body.velocity.y = 200;
      break;
    //just in case, prevent movement if not the above keys
    default:
      playerObject.body.velocity.y = 0;
      playerObject.body.velocity.x = 0;
      break;
            }


}

