# Bear: The Classroom Bot for Cisco Spark

### Get Started

1. Clone this repository:  
`git clone https://github.com/mehamasum/bear-bot`

2. Install dependencies:  
```
cd bear-bot
npm install
```
3. Write a `.env` file with the following:  
```
access_token=YOUR_CISCO_SPARK_ACCESS_TOKEN  
public_address=YOUR_PUBLIC_ADDRESS_WITH_HTTPS  
secret=YOUR_SECRET_STRING  
PORT=YOUR_PORT_NUMBER  
```
4. Launch your bot application by typing:  
`node .`


### Extend This Bot

This bot is built on top of the starter pack of [bot-kit](https://github.com/howdyai/botkit) for [Cisco Spark](https://github.com/howdyai/botkit/blob/master/docs/readme-ciscospark.md)

All the actions this bot can perform are in `skills/` folder. The main bot application will automatically include any files placed there.

A skill module should be in the format:
```
module.exports = function(controller) {
    // add event handlers to controller
}
```
