#/bin/bash
cd skill_lambda
rm -R package
rm -R build
rm *.zip

pip install -r requirements.txt  --target ./package
mkdir build
cp -R package/* build/
rsync -r --exclude 'build' --exclude 'package' . build/

cd build
zip -r lambda.zip .

cd ../..
