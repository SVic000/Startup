# CS260-Web-Go-Fish
CS260 Semester Project
## Introduction
For my semester project, I think I've decided that I'm going to do something crazy. Unfortunately, since I am pretty new to coding and don't quite understand the scope of the project, I don't quite know how every aspect that is expected of me will be fulfilled. I'm just going to get an idea out there and see if I can refine it into meeting everything I need. 
## General Idea/Elevator Pitch
I think I'm going to try to implement a very simple version of Go Fish. The amount of work will probably vary since there might be things I'll need to dial back on. I have the general feel of everything that I hope to be able to capture. I plan to have 4 pages in total. The actual name of the website is under construction, but as of now it's call CATfish. A play on the game and the themeing.

Some key features I hope to impliment are mostly the game elements, but that doesn't mean I won't put some care into other aspects of the website like the login and score pages. The main menu is where you'll be able to access everything easily and will be where the other pages usually fall back on. I might try implimenting a way to "rematch" the player if they agree to it, but I don't know how yet (that'll come as I try to figure everything out). The images capture the majority of what I'm going for, so refer to those if you're feeling a bit lost on what I'm trying to do here. 

![flow](https://github.com/user-attachments/assets/e0546241-d84d-4863-ad80-e88830f6f23a)

![pages](https://github.com/user-attachments/assets/21255854-a8dc-45a4-9cbc-1e73e6ce4f02)


### HTML:
I plan to have 4 pages in total. One for the required log in. One as a menu, sonmething other pages can fall back on. One as the actual game experience. And the last to keep track of how many times the player has won against others. This will be seen as "catching fish".

### CSS
I'll only be focusing on mobile (iPhone) and laptop formatting, and I'll make sure that it doesn't feel like there's a lot of white space, nor that there's a weird feel to the formatting. It'll all be intentional. I plan to make all my assets 2D so that I can just cycle through environments and feels by just displaying images. I want it to feel cohesive.

### React
I'm not sure what tools are available through react but I do know that the majority of my animations will fall on the depiction of the other player. I plan on cycling through faces depending on if certain conditions are met. I might even set a timer that resets if the head changes because of an action that makes the character blink. I don't know. I want this to feel whimsical and fun while not really villianizing the other player. It's all for fun, and it's all cat themed because why not. This is probably the step that I could lose myself to so I'll try limiting my brain so I don't fall behind trying to make everything perfect. I do not plan on actually animating the cards (pick up and put down) for my own sanity, but I do have the ability to make my assets. So that's what the majority of everything will be. 2D drawings that I've made.

![reactions](https://github.com/user-attachments/assets/c3a1d1f1-7d74-486b-a2b8-3c8385d05691)

### Service
Backendpoints for:
* randomly call https://alexwohlbruck.github.io/cat-facts/ and find a random cat fact to display at the top of the screen. Just a fun thing for no reason (I found this API exploring and it alone has steered the themeing of my website).
* retrieving opponent moves
* submitting own moves
* retrieving whether the other user has a card or not, and the same with submitting the own user's responses to questions ("Do you have a two?")

### DB 
Store user wins and perhaps which cards (in the current session) have not been in play yet for the next draw. I am not quite sure how a DB works, so once we start going over their uses I'll be able to specify what I want to do with this.

### Websocket 
Both players will be constantly interacting with each other. I'm not sure how I'll get the players to ask questions to eachother, but I know that I want the cards to be button like that changes depending on who's turn it is. Asking the oponent if its your turn, and giving the card if it's there. Maybe I'll also impliment a HUGE go fish card to click on if you don't have the card. 


I haven't commited to any of these ideas, It'll probably change as I go on and figure out my limits and from there this project will evolve into something doable. So I don't die this semester. I'm still new to webprogramming so I don't exactly know my tools or powers, I'm excited to learn.
