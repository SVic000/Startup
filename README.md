# CATfish - GOfish

I think I'm going to try to implement a very simple version of Go Fish. The amount of work will probably vary since there might be things I'll need to dial back on. I have the general feel of everything that I hope to be able to capture. I plan to have 4 pages in total. The actual name of the website is under construction, but as of now it's call CATfish. A play on the game and the themeing.

### Elevator pitch

I plan on implimenting a very simple version of GOfish but entirely cat themed. The main focus will be the game aspect, but through aesthetics and look I'll be able to make a webiste that is also fun to be on. All assets will be done by me, and there will be a ton of assets. Like the cards, the oponent, the environment, and some art pieces to decorate the login, scores, and main home page.

### Design

![pages](https://github.com/user-attachments/assets/21255854-a8dc-45a4-9cbc-1e73e6ce4f02)

I think I'm going to try to implement a very simple version of Go Fish. The amount of work will probably vary since there might be things I'll need to dial back on. I have the general feel of everything that I hope to be able to capture. I plan to have 4 pages in total. The actual name of the website is under construction, but as of now it's call CATfish. A play on the game and the themeing.

![flow](https://github.com/user-attachments/assets/e0546241-d84d-4863-ad80-e88830f6f23a)

### Key features

- An interactable game with well implimented animation
- A main menu hub that connects to all other webpages
- An attempt at a rematch feature so that players can play the same person again
- Cohesive feel to entire website so users 

### Technologies

I am going to use the required technologies in the following ways.

## HTML ##
I plan to have 4 pages in total. One for the required log in. One as a menu, sonmething other pages can fall back on. One as the actual game experience. And the last to keep track of how many times the player has won against others. This will be seen as "catching fish".

## CSS ##
I'll only be focusing on mobile (iPhone) and laptop formatting, and I'll make sure that it doesn't feel like there's a lot of white space, nor that there's a weird feel to the formatting. It'll all be intentional. I plan to make all my assets 2D so that I can just cycle through environments and feels by just displaying images. I want it to feel cohesive.

## React ##
I'm not sure what tools are available through react but I do know that the majority of my animations will fall on the depiction of the other player. I plan on cycling through faces depending on if certain conditions are met. I might even set a timer that resets if the head changes because of an action that makes the character blink. I don't know. I want this to feel whimsical and fun while not really villianizing the other player. It's all for fun, and it's all cat themed because why not. This is probably the step that I could lose myself to so I'll try limiting my brain so I don't fall behind trying to make everything perfect. I do not plan on actually animating the cards (pick up and put down) for my own sanity, but I do have the ability to make my assets. So that's what the majority of everything will be. 2D drawings that I've made.

![reactions](https://github.com/user-attachments/assets/c3a1d1f1-7d74-486b-a2b8-3c8385d05691)

## Service ##
Backendpoints for:
* randomly call https://alexwohlbruck.github.io/cat-facts/ and find a random cat fact to display at the top of the screen. Just a fun thing for no reason (I found this API exploring and it alone has steered the themeing of my website).
* retrieving opponent moves
* submitting own moves
* retrieving whether the other user has a card or not, and the same with submitting the own user's responses to questions ("Do you have a two?")

## DB ##
Store user wins and perhaps which cards (in the current session) have not been in play yet for the next draw. I am not quite sure how a DB works, so once we start going over their uses I'll be able to specify what I want to do with this.

## Websocket ##
Both players will be constantly interacting with each other. I'm not sure how I'll get the players to ask questions to eachother, but I know that I want the cards to be button like that changes depending on who's turn it is. Asking the oponent if its your turn, and giving the card if it's there. Maybe I'll also impliment a HUGE go fish card to click on if you don't have the card.

## 🚀 AWS deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [x] **Server deployed and accessible with custom domain name** - [ [My server link](https://catfishgofish.click/).]

## 🚀 HTML deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [x] **HTML pages** - I planned out all 4 of my html pages
- [x] **Proper HTML element usage** - I did complete this part of the deliverable.
- [x] **Links** - Every page has a link to the webpages they have access too.
- [x] **Text** - I did complete this part of the deliverable.
- [x] **3rd party API placeholder** - I did complete this part of the deliverable. although I'm not sure which tag it should've been under so I just did a text.
- [x] **Images** - I did complete this part of the deliverable. Although I plan on refining the html tags and whatnot once I'm more familiar with the pathing of React and CSS.
- [x] **Login placeholder** - I did complete this part of the deliverable.
- [x] **DB data placeholder** - I did complete this part of the deliverable.
- [x] **WebSocket placeholder** - I did complete this part of the deliverable.

## 🚀 CSS deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [ ] **Header, footer, and main content body** - I did not complete this part of the deliverable.
- [ ] **Navigation elements** - I did not complete this part of the deliverable.
- [ ] **Responsive to window resizing** - I did not complete this part of the deliverable.
- [ ] **Application elements** - I did not complete this part of the deliverable.
- [ ] **Application text content** - I did not complete this part of the deliverable.
- [ ] **Application images** - I did not complete this part of the deliverable.

## 🚀 React part 1: Routing deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [ ] **Bundled using Vite** - I did not complete this part of the deliverable.
- [ ] **Components** - I did not complete this part of the deliverable.
- [ ] **Router** - I did not complete this part of the deliverable.

## 🚀 React part 2: Reactivity deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [ ] **All functionality implemented or mocked out** - I did not complete this part of the deliverable.
- [ ] **Hooks** - I did not complete this part of the deliverable.

## 🚀 Service deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [ ] **Node.js/Express HTTP service** - I did not complete this part of the deliverable.
- [ ] **Static middleware for frontend** - I did not complete this part of the deliverable.
- [ ] **Calls to third party endpoints** - I did not complete this part of the deliverable.
- [ ] **Backend service endpoints** - I did not complete this part of the deliverable.
- [ ] **Frontend calls service endpoints** - I did not complete this part of the deliverable.
- [ ] **Supports registration, login, logout, and restricted endpoint** - I did not complete this part of the deliverable.


## 🚀 DB deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [ ] **Stores data in MongoDB** - I did not complete this part of the deliverable.
- [ ] **Stores credentials in MongoDB** - I did not complete this part of the deliverable.

## 🚀 WebSocket deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [ ] **Backend listens for WebSocket connection** - I did not complete this part of the deliverable.
- [ ] **Frontend makes WebSocket connection** - I did not complete this part of the deliverable.
- [ ] **Data sent over WebSocket connection** - I did not complete this part of the deliverable.
- [ ] **WebSocket data displayed** - I did not complete this part of the deliverable.
- [ ] **Application is fully functional** - I did not complete this part of the deliverable.
