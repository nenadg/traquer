# traquer
Records and reproduces user's in-page behavior

Traquer is a tool that enables you to record a testing session on you web/page/app, than reproduce it, monitor how it performed, create a naïve heatmap, and even automate your testing sessions using Selenium Webdriver and Jasmine...

Original blog post about this is already here - http://lessgeneric.com/testing/traquer-testing-made-easy/ so go check it out.


# Record and playback
In following example, you'll see a record and playback on Ext JS example called 'Admin Dashboard'. 
[![record and playback](https://img.youtube.com/vi/KVlg4UDz6L4/0.jpg)](https://www.youtube.com/watch?v=KVlg4UDz6L4)

Another example shows that there is actual list of recorded cases, which you can use to set up playback.
[![playback saved](https://img.youtube.com/vi/KVlg4UDz6L4/0.jpg)](https://www.youtube.com/watch?v=HT-ciY_RMQ0)

# Heatmap
You can create heatmap from one ore many cases.

[![heatmap](https://img.youtube.com/vi/KVlg4UDz6L4/0.jpg)](https://www.youtube.com/watch?v=vmjcYKIsKrc)

# Playback after DOM mutation
In this example, I've reloaded page which means - new element id's (testing hell).
[![dom mutation](https://img.youtube.com/vi/KVlg4UDz6L4/0.jpg)](https://www.youtube.com/watch?v=XFiNei0HWqg)

# Export/import to different browsers
Here, I'll create case in Firefox, export it from there, and import it to Chrome. It'll perform good.
[![export import](https://img.youtube.com/vi/KVlg4UDz6L4/0.jpg)](https://www.youtube.com/watch?v=ANyAYFWIRBY)

# Joining cases
In this last video for this post, I'm showing how to join multiple cases to one 'mega-case'.
[![joining cases](https://img.youtube.com/vi/KVlg4UDz6L4/0.jpg)](https://www.youtube.com/watch?v=pJZ9JV5TjsQ)


# Work in progress
This is WIP, some features don't work as they should (jasmine/seleinum automation for example).


Contribution/interest is welcomed.

# Credits/Contributors
I won't forget to mention and thank these great guys who contributed to make this available:

- Bojan Dević (https://github.com/bojandevic) who refactored initial version of this tool (which was messy load of crap), which made further development available
- Mirko Kukoleča (https://github.com/mkukoleca) who was idea originator, some two years ago
- Goran Smiljanić (https://github.com/sgoran) for early reviews, and great ideas about how this should look and work,
- ... (more people to come)
