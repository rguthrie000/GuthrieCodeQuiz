//see questions.js, which contains
//var questions =[{},...{}];
//
//each object in the questions array has structure:
//  {q:"",a["","","",""],c:""}, 

var rulesListEl  = document.getElementById("rules");
var questionEl   = document.getElementById("question");
var answerListEl = document.getElementById("answers");
var answer0El    = document.getElementById("ans-0");
var answer1El    = document.getElementById("ans-1");
var answer2El    = document.getElementById("ans-2");
var answer3El    = document.getElementById("ans-3");
var resultEl     = document.getElementById("result");
var startBtnEl   = document.getElementById("startBtn");
var scoresBoxEl  = document.getElementById("scoresBox");
var enterScoreEl = document.getElementById("enterScore");
var lastScoreEl  = document.getElementById("lastScore");
var playerNameEl = document.getElementById("playerName");
var timerEl      = document.getElementById("countdown");
var addMeEl      = document.getElementById("addMe");
var winnerEl     = document.getElementById("correctAudio");
var loserEl      = document.getElementById("wrongAudio");
var timeExpEl    = document.getElementById("timeoutAudio");
var top5AudioEl  = document.getElementById("top5Audio");

var gameClock;
var secondsRemaining = 0;
var qSequence = 0;
var ansCorrect = 0;
var score = -1;
var questions;

const WAIT_FOR_START     = 0;
const Q_N_A              = 1;
const WAIT_FOR_SCORE_ACK = 2;
const ENTERING_TOP_FIVE  = 3;
var gameState = WAIT_FOR_START;

const CORRECT_BONUS = 10; // seconds
const WRONG_PENALTY = 10; // seconds

function startPage()
{
  //hide & disable
  questionEl.style.display   = "none";
  answerListEl.style.display = "none";
  timerEl.style.display      = "none";
  resultEl.style.display     = "none";
  enterScoreEl.style.display = "none";

  answer0El.setAttribute("disabled", "true");
  answer1El.setAttribute("disabled", "true");
  answer2El.setAttribute("disabled", "true");
  answer3El.setAttribute("disabled", "true");
  resultEl.setAttribute("disabled", "true");
  addMeEl.setAttribute("disabled", "true");

  //reveal & enable
  rulesListEl.style.display  = "inline";
  startBtnEl.style.display   = "inline";
  scoresBoxEl.style.display  = "inline";

  for (let i = 0; i < highScores.length; i++)
  {
    var s = highScores[i].score;
    scoresBoxEl.children[i+1].innerText = 
      s == -1 ? "<empty>" : `${s}:\t${highScores[i].player}`;
  }
}

function gamePage()
{
  //hide
  rulesListEl.style.display  = "none";
  startBtnEl.style.display   = "none";
  scoresBoxEl.style.display  = "none";
  resultEl.style.display     = "none";
  enterScoreEl.style.display = "none";
  //reveal
  timerEl.style.display      = "inline"
  questionEl.style.display   = "inline";
  answerListEl.style.display = "inline";
  answer0El.removeAttribute("disabled");
  answer1El.removeAttribute("disabled");
  answer2El.removeAttribute("disabled");
  answer3El.removeAttribute("disabled");
}

function postQnA(which)
{
  // which = which >= questions.length? questions.length-1: (which < 0? 0:which);
  questionEl.textContent = which +". " + questions[which].q;
  for (let i=0;i<4;i++) {answerListEl.children[i].textContent=`> ${questions[which].a[i]}`;}
}

function gameOver()
{
  score = secondsRemaining < 0 ? 0 : secondsRemaining;
  clearInterval(gameClock);
  if (score < 1)
  {
    timeExpEl.play();
  }
  questionEl.style.display   = "none";
  answerListEl.style.display = "none";
  timerEl.style.display      = "none";
  resultEl.style.display     = "inline";
  resultEl.textContent = 
    `${ansCorrect} of ${questions.length} correct, your score: ${score}`;
  resultEl.removeAttribute("disabled");
  gameState = WAIT_FOR_SCORE_ACK;
  console.log(`score: ${score}, highScores[last]: ${highScores[highScores.length-1].score}`);
  if (score > highScores[highScores.length-1].score)
  {
    enterScoreEl.style.display = "inline";
    addMeEl.removeAttribute("disabled");
    gameState = ENTERING_TOP_FIVE;
    top5AudioEl.play();
  }
}

function clockTick() 
{
  // wrong answer penalties may take secondsRemaining to <= 0
  if (secondsRemaining > 0)
  {
  // update the countdown and write it to the page.
  timerEl.textContent = --secondsRemaining + " s";
  }
  // reckoning the last second may have taken 
  // secondsRemaining to 0.
  if (secondsRemaining < 1) 
  {
    gameOver();
  }
}

function buttonClick() 
{
  //What was clicked?...get the button value
  var choice = event.target.value;
  console.log(`event.target.value: ${choice}`);

  //State Machine
  switch (gameState)
  {
    case WAIT_FOR_START:
      if (choice == "start")
      {
        gamePage();
        secondsRemaining = 100.0;
        gameClock = setInterval(clockTick,1000.0);
        ansCorrect = 0;
        postQnA(qSequence = 0);
        gameState = Q_N_A;
      }
      break;
    case Q_N_A:
      if (choice == questions[qSequence].c)
      {
        secondsRemaining += CORRECT_BONUS;
        ansCorrect++;
        winnerEl.play();
      }
      else
      {
        secondsRemaining -= WRONG_PENALTY;
        loserEl.play();
      }

      if (++qSequence < questions.length)
      {
        postQnA(qSequence);
      }
      else
      {
        gameOver();
      }
      break;
    case WAIT_FOR_SCORE_ACK:
      if (choice == "resultSeen")
      {
        lastScoreEl.textContent = `Your last score: ${score}`;
        startPage();
        gameState = WAIT_FOR_START;
      }
      break;
    case ENTERING_TOP_FIVE:
      if (choice == "addMe")
      {
        // overwrite the lowest score in highScores, then re-sort
        // the array before committing the updated list to local storage.
        var newName = playerNameEl.value;
        if (newName)
        {
          highScores[highScores.length-1].score = score;
          highScores[highScores.length-1].player= newName;
          // the sort will arrange the score objects in decreasing order
          // by score. 
          highScores.sort(function(a,b) {return(b.score-a.score)});
          localStorage.setItem('highScores',JSON.stringify(highScores));
        }
      }
      if (choice == "addMe" || choice == "resultSeen")
      {
        lastScoreEl.textContent = `${score}\tYour Score`;
        startPage();
        gameState = WAIT_FOR_START;
      }
      break;  
  }  
  
}

// document.getElementsByClassName("btn").addEventListener("click", buttonClick);
document.getElementById("startBtn"  ).addEventListener("click", buttonClick);
document.getElementById("answers"   ).addEventListener("click", buttonClick);
document.getElementById("result"    ).addEventListener("click", buttonClick);
document.getElementById("addMe"     ).addEventListener("click", buttonClick);

// check local storage for a highScore list.
// if none, initialize the internal copy, but don't store it
// unless/until a new score is obtained through gameplay.
var highScores = JSON.parse(localStorage.getItem("highScores"));
if (!highScores)
{
  highScores = 
  [
    {score: -1, player: "<empty>"},
    {score: -1, player: "<empty>"},
    {score: -1, player: "<empty>"},
    {score: -1, player: "<empty>"},
    {score: -1, player: "<empty>"},
  ];  
}    

questions = questionsArray.sort
(
  function()
  {
    return(Math.random()-0.5);
  }
);

startPage();


