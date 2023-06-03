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
- NodeJs
  - Option #1: GUI install: `https://nodejs.org/en`
  - Option #2: For Linux/Mac, the module n makes version-management easy `npm install -g n`
    - Install the latest stable version: `n stable`
    - (Optionally) Install the latest version: `n latest`
  - Verify the installation: `node -v`
- Lerna CLI
  - `npm install -g lerna`
- AWS CLI
  - Installation Guide: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html
  - GUI Installation: https://awscli.amazonaws.com/AWSCLIV2.pkg
  - Verify the installation: 
    ```
      $ which aws
      /usr/local/bin/aws 
      $ aws --version
      aws-cli/2.10.0 Python/3.11.2 Darwin/18.7.0 botocore/2.4.5
    ```

Installation
------------ 
1. Clone the repository using 
   1. `git clone https://github.com/username/repo.git`
2. Navigate to the root directory of the cloned repository. 
3. Install lerna cli 
   1. `npm install -g lerna`
4. Build Python lambda code to zip
   1. `chmod +x ./aws-lambda-helper.sh`
   2. `./aws-lambda-helper.sh`
5. Run the installation script inside the project root folder using
   1. install package/infrastructure dependency: `lerna bootstrap` 
   2. build all packages recursively: `npm run release`

Deploy to AWS Account
---
If you have NOT configured AWS profiles:
1. Go to your AWS console -> IAM
2. Create a IAM user with Administrator access
3. Create a "secrete access key"
4. Run `aws configure` in terminal, and give the key

Otherwise:
- Start the cloudformation deployment by: `npm run deploy`

Architecture
------------
![](https://d2s5tydsfac9v4.cloudfront.net/chat-gpt-arch-diagram.drawio.png)
