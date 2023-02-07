printf "\033[1mStarting installation process...\n\033[0m"
rm .env.development
rm .env.production
printf "\033[1mCreating .env files...\n\033[0m"
cp .env.example .env.development
cp .env.example .env.production
cp .env.example .env.test
printf "\033[1mInstalling dependencies...\n\033[0m"
npm i > /dev/null 2>&1
printf "\033[1mInstallation complete!\n\033[0m"
printf "\033[1m=============== \033[33mDon't forget to edit the .env files!\033[0m \033[1m===============\n\033[0m"
