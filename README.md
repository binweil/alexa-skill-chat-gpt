Description
-----------
This repository is showing how to build an Alexa skill (ChatGPT) interact with OpenAI's GPT models. It allows Alexa customers 
speak to AI models on any Alexa devices. For those devices supports multi-modal, this chat gpt skill will render the APL
cards, which displays the skill launch screen, help screen, and question response screen.

There are three folders inside the respo:
- assets: contains the images for the skill detail page, multi-modal, in-skill products
- interactionModels: a set of json files describing how Alexa should route the user utterances to intents and slots
- skill_lambda: the python code to handle the Alexa requests

Requirements
------------
- Python 3.7 
- Required packages can be installed using `pip install -r requirements.txt`  

Installation
------------ 
1. Clone the repository using `git clone https://github.com/username/repo.git`
2. Navigate to the root directory of the cloned repository. 
3. Run the installation script inside the project root folder using `./aws-lambda-helper.sh`
4. Inside the skill_lambda/build, verify there's a zip file called `lambda.zip`.
5. Go to the aws console, and upload the `lambda.zip` to your lambda function

Architecture
------------
![](https://d2s5tydsfac9v4.cloudfront.net/chat-gpt-arch-diagram.drawio.png)
