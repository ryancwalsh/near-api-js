// https://stackoverflow.com/a/64598374/
// from the root (near-api-js) directory, run `node examples/cookbook/accounts/access-keys/generate-new-seed-phrase-for-existing-secret-key.js`.

const prompt = require("prompt");
const path = require("path");
const homedir = require("os").homedir();
const { utils, keyStores, connect } = require("near-api-js");
const { generateSeedPhrase } = require("near-seed-phrase"); // https://github.com/near/near-seed-phrase

// Create a seed phrase with its corresponding keys.
const { seedPhrase, publicKey, secretKey } = generateSeedPhrase();

const CREDENTIALS_DIR = ".near-credentials";
const credentialsPath = path.join(homedir, CREDENTIALS_DIR);
const keyStore = new keyStores.UnencryptedFileSystemKeyStore(credentialsPath);

const config = {
    // TODO: Allow the user to choose a different config during the prompt in the terminal.
    keyStore,
    networkId: "testnet",
    nodeUrl: "https://rpc.testnet.near.org",
};

async function addSecretKeyToAccount(
    accountId,
    publicKey,
    secretKey,
    seedPhrase
) {
    //console.log({ secretKey }); // TODO: Remove this line.
    const keyPair = new utils.key_pair.KeyPairEd25519(secretKey); // TODO: Figure out how to get a key_pair from a secretKey string.
    const near = await connect(config);
    const account = await near.account(accountId);
    await keyStore.setKey(config.networkId, publicKey, keyPair);
    await account.addKey(publicKey);
    console.log(
        `Now this seed phrase is associated with account '${accountId}'`,
        {
            seedPhrase,
        }
    );
}

function onErr(error) {
    console.error(error);
    return 1;
}

prompt.start(); // https://nodejs.org/en/knowledge/command-line/how-to-prompt-for-command-line-input/

const schema = {
    // https://github.com/flatiron/prompt#valid-property-settings
    properties: {
        accountId: {
            description: `NEAR Account IDs look like 'example.near' or 'someone.testnet'.\n\n
            Consider only acccounts whose credentials you already have stored in ${credentialsPath}.\n\n
            What is the Account ID of the NEAR account that you want to add a new seed phrase to?`,
            required: true,
        },
        confirm: {
            description: `Here is a new seed phrase:\n\n
            '${seedPhrase}'\n\n
            Have you safely recorded this seed phrase, and are you sure you want to associate it with this account now? t/f true/false`, // TODO: Allow yes/no/y/n
            type: "boolean",
        },
    },
};

prompt.get(schema, function (error, inputs) {
    if (error) {
        return onErr(error);
    }
    console.log({ inputs });

    if (inputs.confirm) {
        addSecretKeyToAccount(
            inputs.accountId,
            publicKey,
            secretKey,
            seedPhrase
        );
    } else {
        console.log("Canceled.");
    }
});
