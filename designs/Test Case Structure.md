Test Case ID (or TCID)(M):
Is a unique identifier code associated to your test case. Should be unique across ALL projects and never duplicated. Makes for simpler management and reporting in your test case library - especially if you intend it to scale into hundreds or thousands of tests. Will generally appear on defect and management reports

Test Case Name (M):
Is a very short, unique, English-description of your test. Serves the same purpose as TCID however for human-readable purposes. Will generally appear on defect and management reports 

Test Case Description/Objective (M):
This field is a more detailed description of WHAT, WHY and sometimes HOW you are testing. At the very least it should contain a summary description of the test condition/s you are validating. This is not meant to be a description of the underlying functionality. Will not generally appear on defect and management reports.

Test Author (M):
Its important to know who the test author was for downstream team members to refer back to if they have questions.  

Test Type (O):
Denotes what type of test this is. This is more for later management reporting but also useful in reviews and later supporting regression testing 

Test Pre-Requisites (O):
Also known as pre-conditions, this field describes the system and data requirements that need to be provided prior to executing the test. For example when testing logging into an application, a valid userid/password combination must have been supplied.

Overall Test Result (O):
Used to record the state of the test during and after execution.

Child Fields

Test Steps are children fields and denote that there can be many within a single test case. In our structure, they contain the following fields:

Test Step Number (M):
Similar to TCID but for the test step. Does not need to be unique across tests or projects. Test Steps should be presented in sequential, executable order and should be able to be re-ordered during both execution and maintenance activities if new steps are added.

Test Step Description (M):
Describes the user or system action to execute as part of that test step.
  
Test Data (O):
Describes the data to use or that was used during a test execution operation.
 
Expected Result (M):
Describes the expected result that should be achieved for the test. This is arguably one of the most important parts of a test case.

Actual Result (O):
A record of the actual result of the test. Is optional because a test step that has passed is assumed to have met the Expected Result check. In models where test evidence is required to be obtained, this field would be mandatory and contain something like a screen dump. This field is also used in automation models as well.     
  
Step Status (M):
Denotes the test result status of the test step. Generally a PASS/FAIL will suffice. The aggregate results of all test steps would form the overall Test Result. 

Notes/Comments (O): 
A field useful for recording any additional notes for the step. These may include revision or maintenance requirements obtained during execution, defect numbers or maybe even helper comments left from by one tester to the next. 
