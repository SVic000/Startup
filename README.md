# CS260-Web-Choose-your-own
CS260 Semester Project
# Introduction
For my semester project, I think I've decided that I'm going to do something crazy. Unfortunately, since I am pretty new to coding and don't quite understand the scope of the project, I don't quite know how every aspect that is expected of me will be fulfilled. I'm just going to get an idea out there and see if I can refine it into meeting everything I need. 
# General Idea
I think I'm going to try to implement a very simple version of Go Fish. The amount of work will probably vary since there might be things I'll need to dial back on.

![General Layout](https://github.com/user-attachments/assets/e8209a70-798f-4288-9774-840ee9278096)


HTML: I don't know how many pages I'll need, but for now, I'll make sure it's written correctly and feels aesthetically pleasing to the user.
CSS: I'll only be focusing on mobile (iPhone) and laptop formatting, and I'll make sure that it doesn't feel like there's a lot of space, nor that there's a weird feel to the formatting. It'll all be intentional. 
React: Perhaps have the enemy opponent (as seen as a cat) make reactions due to our users' responses and questions. I've attached a fun idea, though I do not know if I'll have time for it. There will also be animations for the cards. I haven't decided what yet.

![enemy animationn ideas](https://github.com/user-attachments/assets/6dd88127-6eef-4a2d-a30a-b019617ec06d)

Service: Backendpoints for -
* randomly call https://alexwohlbruck.github.io/cat-facts/ and find a random cat fact to display at the top of the screen. Just a fun thing for no reason.
* retrieving opponent moves
* submitting own moves
* retrieving whether the other user has a card or not, and the same with submitting the own user's responses to questions ("Do you have a two?")
DB: Store user wins and perhaps which cards (in the current session) have not been in play yet for the next draw.
Websocket: Both players will be constantly interacting with each other, maybe if I have time, I'll implement a bot that can play so that you don't NEED another player, but that win will not be recorded in the DB

I haven't commited to any of these ideas, It'll probably change as I go on and figure out my limits and from there this project will evolve into something doable. So I don't die this semester.
