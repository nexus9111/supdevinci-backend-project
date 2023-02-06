printf "Starting installation process..."
rm .env.development
rm .env.production
cp .env.example .env.development
cp .env.example .env.production
npm i
printf "Installation complete!\n"