var app = angular.module("studentApp", []);

// Supabase Connection
var SUPABASE_URL = "https://ghcumqiswbocdxcvwuqh.supabase.co";

var SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoY3VtcWlzd2JvY2R4Y3Z3dXFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM3NTU3NDAsImV4cCI6MjEwOTMzMTc0MH0.T5q9rWx0AdYQORghbG7vpRZe02OXoY4FdDYehxifhUg";

// Create Supabase Client
var supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

// AngularJS Controller
app.controller("StudentController", function($scope) {

    // Default Values
    $scope.students = [];
    $scope.newStudent = {};
    $scope.searchText = "";
    $scope.showInfo = false;
    $scope.sortColumn = "id";
    $scope.reverseSort = false;
    $scope.loading = false;
    $scope.errorMessage = "";
    $scope.successMessage = "";

    // Load Students from Database
    $scope.loadStudents = async function() {

        $scope.loading = true;
        $scope.errorMessage = "";

        var { data, error } = await supabaseClient
            .from("students")
            .select("*")
            .order("id", { ascending: true });

        $scope.$applyAsync(function() {

            if (error) {
                $scope.errorMessage = error.message;
            } else {
                $scope.students = data;
            }

            $scope.loading = false;
        });
    };

    // Add Student
    $scope.addStudent = async function() {

        if (!$scope.newStudent.name ||
            !$scope.newStudent.department ||
            !$scope.newStudent.usn ||
            !$scope.newStudent.contact_details) {

            alert("Please enter all student details!");
            return;
        }

        $scope.loading = true;
        $scope.errorMessage = "";
        $scope.successMessage = "";

        var { error } = await supabaseClient
            .from("students")
            .insert([{
                name: $scope.newStudent.name,
                department: $scope.newStudent.department,
                usn: $scope.newStudent.usn,
                contact_details: $scope.newStudent.contact_details,
                active: true
            }]);

        if (error) {

            $scope.$applyAsync(function() {
                $scope.errorMessage = error.message;
                $scope.loading = false;
            });

        } else {

            $scope.$applyAsync(function() {
                $scope.newStudent = {};
                $scope.successMessage = "Student added successfully!";
            });

            await $scope.loadStudents();
        }
    };

    // Delete Student
    $scope.deleteStudent = async function(student) {

        if (!confirm("Are you sure you want to delete this student?")) {
            return;
        }

        $scope.errorMessage = "";
        $scope.successMessage = "";

        var { error } = await supabaseClient
            .from("students")
            .delete()
            .eq("id", student.id);

        if (error) {

            $scope.$applyAsync(function() {
                $scope.errorMessage = error.message;
            });

        } else {

            $scope.$applyAsync(function() {
                $scope.successMessage = "Student deleted successfully!";
            });

            await $scope.loadStudents();
        }
    };

    // Change Student Status
    $scope.toggleStatus = async function(student) {

        var newStatus = !student.active;

        var { error } = await supabaseClient
            .from("students")
            .update({ active: newStatus })
            .eq("id", student.id);

        if (error) {

            $scope.$applyAsync(function() {
                $scope.errorMessage = error.message;
            });

        } else {

            $scope.$applyAsync(function() {
                $scope.successMessage = "Student status updated!";
            });

            await $scope.loadStudents();
        }
    };

    // Sorting
    $scope.sortBy = function(column) {

        if ($scope.sortColumn === column) {
            $scope.reverseSort = !$scope.reverseSort;
        } else {
            $scope.sortColumn = column;
            $scope.reverseSort = false;
        }
    };

    // Load Students when Page Opens
    $scope.loadStudents();

});