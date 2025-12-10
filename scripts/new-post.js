const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
});

const questions = {
        title: 'Post Title: ',
        description: 'Description: ',
        tags: 'Tags (comma separated): ',
        isPublic: 'Is this post public? (y/n, default: y): ',
};

const postData = {
        title: '',
        description: '',
        tags: [],
        date: new Date().toISOString().split('T')[0],
        public: true
};

function ask(question) {
        return new Promise((resolve) => {
                rl.question(question, (answer) => resolve(answer));
        });
}

async function main() {
        console.log('Creating a new blog post...\n');

        postData.title = await ask(questions.title);
        postData.description = await ask(questions.description);

        const tagsStr = await ask(questions.tags);
        postData.tags = tagsStr.split(',').map(t => t.trim()).filter(t => t);

        const isPublicStr = await ask(questions.isPublic);
        postData.public = isPublicStr.trim().toLowerCase() !== 'n' && isPublicStr.trim().toLowerCase() !== 'no';

        const slug = postData.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');

        const fileName = `${slug}.md`;
        const filePath = path.join(process.cwd(), 'content/posts', fileName);

        if (fs.existsSync(filePath)) {
                console.error(`\nError: Post "${fileName}" already exists!`);
                rl.close();
                return;
        }

        const fileContent = `---
title: "${postData.title}"
date: "${postData.date}"
description: "${postData.description}"
tags: [${postData.tags.map(t => `"${t}"`).join(', ')}]
public: ${postData.public}
---

Write your content here...
`;

        fs.writeFileSync(filePath, fileContent);
        console.log(`\nSuccess! Created new post at: content/posts/${fileName}`);

        rl.close();
}

main();
