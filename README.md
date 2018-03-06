# Autofill Chrome Extension #

A chrome extension that automates the process of completing college application forms.

### Deployment notes
The entire chrome extension is contained in the `extension` folder. It is
important to note the script `build.py` **must** be run before each deployment in
production.

The build script is essentially a template parser that modifies `manifest.json`
and view files such as `form.html` to reflect all the changes made to mapping files
such as `app.json`. This is necessary so as to make adding new app templates much
easier, safer, and more flexible.
