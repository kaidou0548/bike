module.exports = {
  content: [
    './public/views/**/*.ejs',  
    './public/**/*.{html,ejs}'   
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('tailwindcss'),
    require('autoprefixer')],
};

