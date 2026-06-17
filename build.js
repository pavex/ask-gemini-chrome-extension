const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const isWatch = process.argv.includes('--watch');

async function build() {
    const context = await esbuild.context({
        entryPoints: [
            { in: 'src/background/index.js', out: 'background' },
            { in: 'src/content/index.js', out: 'content' },
            { in: 'src/options/index.js', out: 'options' },
            { in: 'src/popup/index.js', out: 'popup' }
        ],
        bundle: true,
        minify: !isWatch,
        sourcemap: isWatch,
        outdir: 'dist',
        target: ['chrome100'],
        define: {
            'process.env.NODE_ENV': isWatch ? '"development"' : '"production"'
        }
    });

    if (isWatch) {
        await context.watch();
        console.log('Watching for changes...');
    } else {
        await context.rebuild();
        await context.dispose();
        console.log('Build complete!');
    }

    // Copy static files from public to dist
    copyStaticFiles();
}

function copyStaticFiles() {
    if (!fs.existsSync('dist')) {
        fs.mkdirSync('dist');
    }
    
    const filesToCopy = [
        'manifest.json',
        'options.html',
        'popup.html',
        'content.css'
    ];

    filesToCopy.forEach(file => {
        const src = path.join('public', file);
        const dest = path.join('dist', file);
        if (fs.existsSync(src)) {
            fs.copyFileSync(src, dest);
        }
    });

    // Copy icons if they exist
    if (fs.existsSync('public/icons')) {
        if (!fs.existsSync('dist/icons')) fs.mkdirSync('dist/icons');
        fs.readdirSync('public/icons').forEach(icon => {
            fs.copyFileSync(path.join('public/icons', icon), path.join('dist/icons', icon));
        });
    }
}

build().catch(err => {
    console.error(err);
    process.exit(1);
});
