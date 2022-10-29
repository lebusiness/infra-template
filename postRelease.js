/* eslint-disable*/
// !
const axios = require("axios");

let { GITHUB_TOKEN, OAUTH_TOKEN, ORG_ID, tag_name } = process.env;
let curTag = tag_name;

const repositoryUrl = "https://api.github.com/repos/lebusiness/infra-test-last";
const headersGit = {
  headers: { Authorization: GITHUB_TOKEN },
};
const headersTracker = {
  "Content-Type": "application/json;charset=utf-8",
  Authorization: `OAuth ${OAUTH_TOKEN}`,
  "X-Org-ID": ORG_ID,
};

const postRelease = async () => {
  let prevTag;
  try {
    prevTag = await axios.get(repositoryUrl + "/releases/latest", headersGit);
  } catch {
    prevTag = null;
  }

  let responce;

  if (!prevTag) {
    responce = await axios.get(repositoryUrl + "/commits", headersGit);
    responce = responce.data;
  } else {
    responce = await axios.get(
      repositoryUrl + `/compare/${prevTag.data.tag_name}...${curTag}`,
      headersGit
    );
    responce = responce.data.commits;
  }

  const releaseAuthor = responce.at(-1).author.login;
  const releaseVersion = curTag.split("/").at(-1);
  const date = new Date();
  const releaseDate = `${
    date.getMonth() + 1
  }/${date.getDate()}/${date.getFullYear()}`;

  let result = `Ответственный за релиз: ${releaseAuthor}\n Коммиты, попавшие в релиз:\n`;
  responce.forEach((commit) => {
    result += `${commit.sha} ${commit.commit.author.name} ${commit.commit.message}\n`;
  });

  axios("https://api.tracker.yandex.net/v2/issues/HOMEWORKSHRI-185", {
    method: "patch",
    headers: headersTracker,
    data: {
      summary: `Релиз ${releaseVersion} - ${releaseDate}`,
      description: result,
    },
  });
};

postRelease();
