bower install bootstrap react moment ajaxorg/ace-builds
echo

# Create assets dirs
echo '** Installing Bower assets to assets/static **'
mkdir -p assets/static/css assets/static/js assets/static/fonts
mkdir -p assets/static/js/ace


# Copy ace
echo 'ace -> assets/static/js/ace/'
cp -r bower_components/ace-builds/src-min/* assets/static/js/ace/

# Copy bootstrap files to the right place
echo 'bootstrap -> assets/static/{css,js,fonts}/'
cp bower_components/bootstrap/dist/css/bootstrap.min.css assets/static/css
cp bower_components/bootstrap/dist/js/bootstrap.min.js assets/static/js
cp bower_components/bootstrap/dist/fonts/* assets/static/fonts/

# Copy jquery
echo 'jquery -> assets/static/js/'
cp bower_components/jquery/dist/jquery.min.js assets/static/js

# Copy moment
echo 'moment -> assets/static/js/'
cp -r bower_components/moment/min/moment-with-locales.min.js assets/static/js/moment.min.js

# Copy react
echo 'react -> assets/static/js/'
cp bower_components/react/react.min.js assets/static/js/
