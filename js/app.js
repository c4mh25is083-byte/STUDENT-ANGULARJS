var app = angular.module("studentApp", []);

app.controller("StudentController", function ($scope) {

    // SUPABASE CONNECTION
    const SUPABASE_URL =
        "https://ghcumqiswbocdxcvwuqh.supabase.co";

    const SUPABASE_KEY =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoY3VtcWlzd2JvY2R4Y3Z3dXFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM3NTU3NDAsImV4cCI6MjEwOTMzMTc0MH0.T5q9rWx0AdYQORghbG7vpRZe02OXoY4FdDYehxifhUg";

    const ADMIN_ID =
        "5bfcd3f6-a14a-4e82-8b93-19c0cefa6dbe";

    const db = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );

    // DEFAULT VALUES
    $scope.loggedIn = false;
    $scope.loading = false;
    $scope.formLoading = true;
    $scope.formOpen = false;

    $scope.students = [];
    $scope.editing = false;

    $scope.loginData = {};
    $scope.studentForm = {};
    $scope.publicForm = {};

    $scope.searchText = "";
    $scope.sortColumn = "student_name";
    $scope.reverseSort = false;

    $scope.loginError = "";
    $scope.errorMessage = "";
    $scope.successMessage = "";
    $scope.publicMessage = "";
    $scope.publicError = "";

    // ANGULAR UPDATE HELPER
    function updateScope(callback) {
        $scope.$applyAsync(callback);
    }

    // LOAD PUBLIC FORM STATUS
    async function loadFormStatus() {

        try {

            const { data, error } = await db
                .from("portal_settings")
                .select("form_open")
                .eq("id", 1)
                .single();

            if (error) throw error;

            updateScope(function () {
                $scope.formOpen = data.form_open;
                $scope.formLoading = false;
            });

        } catch (error) {

            updateScope(function () {
                $scope.formOpen = false;
                $scope.formLoading = false;
                $scope.publicError = error.message;
            });

        }
    }

    // VERIFY ADMINISTRATOR
    async function verifyAdmin(user) {

        if (!user || user.id !== ADMIN_ID) {

            await db.auth.signOut();

            updateScope(function () {
                $scope.loggedIn = false;
                $scope.loginError =
                    "Access denied. Administrator only.";
            });

            return false;
        }

        updateScope(function () {
            $scope.loggedIn = true;
            $scope.loginError = "";
        });

        await loadStudents();

        return true;
    }

    // ADMIN LOGIN
    $scope.login = async function () {

        $scope.loading = true;
        $scope.loginError = "";

        try {

            const { data, error } = await db.auth
                .signInWithPassword({
                    email: $scope.loginData.email,
                    password: $scope.loginData.password
                });

            if (error) throw error;

            await verifyAdmin(data.user);

        } catch (error) {

            updateScope(function () {
                $scope.loginError = error.message;
            });

        } finally {

            updateScope(function () {
                $scope.loading = false;
            });

        }
    };

    // ADMIN LOGOUT
    $scope.logout = async function () {

        const { error } = await db.auth.signOut();

        if (error) {
            updateScope(function () {
                $scope.errorMessage = error.message;
            });
            return;
        }

        updateScope(function () {
            $scope.loggedIn = false;
            $scope.students = [];
            $scope.loginData.password = "";
            $scope.successMessage = "";
            $scope.errorMessage = "";
        });
    };

    // LOAD STUDENTS
    async function loadStudents() {

        const { data, error } = await db
            .from("students")
            .select("*")
            .order("id", { ascending: true });

        if (error) {
            updateScope(function () {
                $scope.errorMessage = error.message;
            });
            return;
        }

        updateScope(function () {
            $scope.students = data || [];
            $scope.errorMessage = "";
        });
    }

    // PUBLIC STUDENT REGISTRATION
    $scope.registerStudent = async function () {

        $scope.loading = true;
        $scope.publicMessage = "";
        $scope.publicError = "";

        try {

            // Check latest form status
            const { data: settings, error: settingsError } =
                await db
                    .from("portal_settings")
                    .select("form_open")
                    .eq("id", 1)
                    .single();

            if (settingsError) throw settingsError;

            if (!settings.form_open) {
                throw new Error(
                    "Registration is currently closed."
                );
            }

            const student = {
                student_name: $scope.publicForm.student_name.trim(),
                usn: $scope.publicForm.usn.trim().toUpperCase(),
                department: $scope.publicForm.department.trim(),
                year: Number($scope.publicForm.year),
                contact: $scope.publicForm.contact.trim(),
                age: $scope.publicForm.age
                    ? Number($scope.publicForm.age)
                    : null,
                status: "Active"
            };

            const { error } = await db
                .from("students")
                .insert([student]);

            if (error) throw error;

            updateScope(function () {
                $scope.publicForm = {};
                $scope.publicMessage =
                    "Registration submitted successfully!";
            });

        } catch (error) {

            updateScope(function () {
                $scope.publicError = error.message;
            });

        } finally {

            updateScope(function () {
                $scope.loading = false;
            });

        }
    };

    // ADMIN OPEN / LOCK FORM
    $scope.toggleForm = async function () {

        $scope.loading = true;

        const newStatus = !$scope.formOpen;

        try {

            const { error } = await db
                .from("portal_settings")
                .update({
                    form_open: newStatus,
                    updated_at: new Date().toISOString()
                })
                .eq("id", 1);

            if (error) throw error;

            updateScope(function () {
                $scope.formOpen = newStatus;

                $scope.successMessage = newStatus
                    ? "Registration form is now OPEN."
                    : "Registration form is now LOCKED.";

                $scope.errorMessage = "";
            });

        } catch (error) {

            updateScope(function () {
                $scope.errorMessage = error.message;
            });

        } finally {

            updateScope(function () {
                $scope.loading = false;
            });

        }
    };

    // ADD OR UPDATE STUDENT
    $scope.saveStudent = async function () {

        $scope.loading = true;

        try {

            const student = {
                student_name:
                    $scope.studentForm.student_name.trim(),

                usn:
                    $scope.studentForm.usn.trim().toUpperCase(),

                department:
                    $scope.studentForm.department.trim(),

                year:
                    Number($scope.studentForm.year),

                contact:
                    $scope.studentForm.contact.trim(),

                age: $scope.studentForm.age
                    ? Number($scope.studentForm.age)
                    : null,

                status:
                    $scope.studentForm.status || "Active"
            };

            let result;

            if ($scope.editing) {

                result = await db
                    .from("students")
                    .update(student)
                    .eq("id", $scope.studentForm.id);

            } else {

                result = await db
                    .from("students")
                    .insert([student]);

            }

            if (result.error) throw result.error;

            await loadStudents();

            updateScope(function () {

                $scope.studentForm = {};
                $scope.editing = false;

                $scope.successMessage =
                    "Student details saved successfully.";

                $scope.errorMessage = "";

            });

        } catch (error) {

            updateScope(function () {
                $scope.errorMessage = error.message;
            });

        } finally {

            updateScope(function () {
                $scope.loading = false;
            });

        }
    };

    // EDIT STUDENT
    $scope.editStudent = function (student) {

        $scope.studentForm = angular.copy(student);
        $scope.editing = true;

        $scope.successMessage = "";
        $scope.errorMessage = "";

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    // CANCEL EDIT
    $scope.resetForm = function () {

        $scope.studentForm = {};
        $scope.editing = false;

    };

    // DELETE STUDENT
    $scope.deleteStudent = async function (student) {

        const confirmDelete = window.confirm(
            "Are you sure you want to delete " +
            student.student_name + "?"
        );

        if (!confirmDelete) return;

        try {

            const { error } = await db
                .from("students")
                .delete()
                .eq("id", student.id);

            if (error) throw error;

            await loadStudents();

            updateScope(function () {
                $scope.successMessage =
                    "Student deleted successfully.";
                $scope.errorMessage = "";
            });

        } catch (error) {

            updateScope(function () {
                $scope.errorMessage = error.message;
            });

        }
    };

    // COUNT ACTIVE / INACTIVE
    $scope.countStatus = function (status) {

        return $scope.students.filter(function (student) {

            return (student.status || "").toLowerCase() ===
                status.toLowerCase();

        }).length;

    };

    // CHECK EXISTING LOGIN SESSION
    async function checkSession() {

        const { data, error } = await db.auth.getSession();

        if (error) {
            updateScope(function () {
                $scope.loginError = error.message;
            });
            return;
        }

        if (data.session) {
            await verifyAdmin(data.session.user);
        }

    }

    // INITIALIZE WEBSITE
    loadFormStatus();
    checkSession();

});
