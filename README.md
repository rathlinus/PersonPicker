PersonPicker - The easy person selection tool
=====================

Overview
--------

PersonPicker is an interactive web application designed to create and conduct questionnaires based on a predefined list of persons. This tool is ideal for educational settings, surveys, or any scenario where gathering opinions or preferences on a specific group of individuals is required. It features a user-friendly interface for participants to select their answers from a provided list and an admin/editor section for managing the questions and persons involved.

Features
--------

-   **Simple Interface**: Participants can respond to questions, choosing their answers from a predefined list of persons.
-   **Progress Tracking**: Visual progress indicators (dots and progress bar) show participants how far they have progressed through the questionnaire.
-   **Admin Dashboard**: View aggregated responses for each question, visualized effectively with proportional representation.
-   **Question Editor**: A password-protected interface for admins to add, edit, or delete questions.
-   **Responsive Design**: The tool is designed to be responsive and user-friendly across various devices and screen sizes.

Usage
-----

### For Participants

1.  Open the application link provided by the admin.
2.  Answer each question by selecting an option from the dropdown list.
3.  Navigate through the questions using the progress indicators.
4.  Submit your responses.

### For Admins

1.  Access the admin/editor interface at `/dash` or `/edit`.
2.  Use the password provided to log in.
3.  Add, edit, or delete questions as required.
4.  View the results on the dashboard.

Configuration
-------------

-   **questions.json**: Contains the list of questions displayed to participants.
-   **persons.json**: Contains the list of persons that participants can choose from in the questionnaire.

These files can be edited directly or through the admin/editor interface.
