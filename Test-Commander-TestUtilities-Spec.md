Import Utility
- this test support tool generates test cases in the format required for importing using the Import facility.
- When opened it has a modal that has a sliding bar of # tests from 1 up to 1000. By default it will choose a random sample of Test Types, a range for min/max # of test steps, whether or not to include large field value testing for data entry fields like "Test Case Name", Description, Test Data, Expected Reults, Pre-rrequisites, a radio buttonn to include tags or not (futureproofing for later), a list box for .csv or .xlxs format (also include json and for .xlsx and json have a popup message if selected that these are coming soon), 
There should be a Generate and a Cancel button and a close x at top right corner to close the modal. 
When you click generate, the system should kick off a script that generates the test file and saves it in the test-sommander-app-assets/datasets folder
The file should have a name like "import-test-1x-datetimestamp" where 1x is the number of tests its generating
You can create a script or a function that creates the data file based on the import spec
The utility and imprt testing is to be part of the application but at this stage will only be used by app adnins for testing. 