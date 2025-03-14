document.addEventListener("DOMContentLoaded", function () {
  const navItems = document.querySelectorAll(".nav-item");
  const tabContents = document.querySelectorAll(".tab-content");

  function switchTab(tabId) {
    // Ẩn tất cả content
    tabContents.forEach((content) => {
      content.classList.remove("active");
    });

    // Bỏ active khỏi tất cả nav items
    navItems.forEach((item) => {
      item.classList.remove("active");
    });

    // Hiện content được chọn
    const selectedContent = document.getElementById(tabId);
    const selectedNav = document.querySelector(`[data-tab="${tabId}"]`);

    if (selectedContent && selectedNav) {
      selectedContent.classList.add("active");
      selectedNav.classList.add("active");
    }

    // Save the active tab to localStorage
    localStorage.setItem("activeTab", tabId);
  }

  // Thêm event listeners cho các nav items
  navItems.forEach((item) => {
    item.addEventListener("click", function (e) {
      e.preventDefault();
      const tabId = this.getAttribute("data-tab");
      switchTab(tabId);
      if (tabId == "tuition") {
        window.location.reload();
      } else if (tabId == "grades") {
        fetchGrades();
      } else if (tabId == "timetable") {
        fetchTimeTable();
      } else if (tabId === "courses") {
        fetchRegisteredClasses();
      } else if (tabId === "registered-classes") {
        fetchRegisteredClasses();
      }
    });
  });

  // Restore the last active tab from localStorage
  const activeTab = localStorage.getItem("activeTab") || "student-info";
  switchTab(activeTab);

  document
    .getElementById("upload-btn")
    .addEventListener("click", async function () {
      const fileInput = document.getElementById("avatar-input");
      const file = fileInput.files[0];

      if (!file) {
        alert("Please select an image first");
        return;
      }

      const formData = new FormData();
      formData.append("avatar", file);

      try {
        const response = await fetch("/student/upload-avatar", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          document.getElementById(
            "avatar-preview"
          ).src = `data:image/jpeg;base64,${data.avatar}`;
        }
      } catch (error) {
        console.error("Error:", error);
        alert("Upload failed");
      }
    });

  //  fetch and update grades content
  const fetchGrades = async () => {
    try {
      const response = await fetch("/student/grades");
      const data = await response.json();

      console.log("grades");

      const gradesContent = document.getElementById("grades-content");
      let content = `
        <table class="grades-table">
          <thead>
            <tr>
              <th>Course ID</th>
              <th>Course Name</th>
              <th>Credits</th>
              <th>Midterm Score</th>
              <th>Final Score</th>
            </tr>
          </thead>
          <tbody>
      `;

      data.grades.forEach((g) => {
        content += `
          <tr>
            <td>${g.course_id}</td>
            <td>${g.course_name}</td>
            <td>${g.course_credit}</td>
            <td>${g.midterm_score}</td>
            <td>${g.final_score}</td>
          </tr>
        `;
      });

      content += `
        </tbody>
      </table>
      `;

      gradesContent.innerHTML = content;
    } catch (error) {
      console.error("Error fetching grades:", error);
    }
  };

  const calendarEl = document.getElementById("calendar");

  const fetchTimeTable = async () => {
    console.log("timetable");
    const calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: "timeGridWeek", // Hiển thị dạng tuần
      headerToolbar: {
        left: "prev,next today",
        center: "title",
        right: "timeGridWeek",
      },
      events: function (info, successCallback, failureCallback) {
        fetch("student/time-table") // Gọi API lấy thời khóa biểu
          .then((response) => response.json())
          .then((data) => successCallback(data))
          .catch((error) => failureCallback(error));
      },
    });
    calendar.render();
  };

  async function fetchRegisteredClasses() {
    try {
      const response = await fetch("/student/registered-classes");
      const classes = await response.json();
      console.log("register");

      const registeredClassesContainer = document.getElementById(
        "registered-classes-content"
      );
      registeredClassesContainer.innerHTML = classes
        .map(
          (cls) => `
        <div class="class-item">
          <div class="class-details">
            <p>Course: ${cls.course_name}</p>
            <p>Class ID: ${cls.class_id}</p>
            <p>Professor: ${cls.teacher_name}</p>
            <p>Room: ${cls.room_id}</p>
            <p>Time: ${cls.class_time_start} - ${cls.class_time_end}</p>
            <p>Day: ${cls.class_time_day}</p>
          </div>
          <button 
            class="remove-btn" 
            onclick="removeRegisteredClass('${cls.class_id}')"
          >
            Remove
          </button>
        </div>
      `
        )
        .join("");
    } catch (error) {
      console.error("Error fetching registered classes:", error);
    }
  }

  document.querySelector(`[data-tab="${activeTab}"]`).classList.add("active");
  document.getElementById(activeTab).classList.add("active");

  /* eslint-disable no-undef */
  const buttonContainer = document.getElementById("button-container");
  const contentContainer = document.getElementById("content-container");
  let isOpen = false;
  let config = {
    RETURN_URL: "http://localhost:3000/student/update-payment-status",
    ELEMENT_ID: "embeded-payment-container",
    CHECKOUT_URL: "",
    embedded: true,
    onSuccess: (event) => {
      contentContainer.innerHTML = `
        <div style="padding-top: 20px; padding-bottom:20px">
            You have paid successfully
        </div>
      `;
      buttonContainer.innerHTML = `
        <button
          type="submit"
          id="create-payment-link-btn"
          style="
          width: 100%;
          background-color: rgb(131, 217, 142);
          color: white;
          border: none;
          padding: 10px;
          font-size: 15px;
          "
          onclick="fetchAndSwitchToStudentTab('http://localhost:3000/student/update-payment-status')"
        >
          Quay lại trang sinh viên
        </button>
      `;
    },
  };
  buttonContainer.addEventListener("click", async (event) => {
    if (isOpen) {
      const { exit } = PayOSCheckout.usePayOS(config);
      exit();
    } else {
      const checkoutUrl = await getPaymentLink();
      config = {
        ...config,
        CHECKOUT_URL: checkoutUrl,
      };
      console.log(checkoutUrl);
      const { open } = PayOSCheckout.usePayOS(config);
      open();
    }
    isOpen = !isOpen;
    changeButton();
  });

  const getPaymentLink = async () => {
    const response = await fetch(
      "http://localhost:3000/student/create-embedded-payment-link",
      {
        method: "POST",
      }
    );
    if (!response.ok) {
      console.log("server doesn't response!");
    }
    const result = await response.json();

    console.log(result);
    console.log(response);
    return result.checkoutUrl;
  };

  const changeButton = () => {
    if (isOpen) {
      buttonContainer.innerHTML = `
        <button
            type="submit"
            id="create-payment-link-btn"
            style="
            width: 100%;
            background-color: gray;
            color: white;
            border: none;
            padding: 10px;
            font-size: 15px;
            "
        >
            Đóng link thanh toán
        </button>
      `;
    } else {
      buttonContainer.innerHTML = `
        <button
            type="submit"
            id="create-payment-link-btn"
            style="
                width: 100%;
                background-color: rgb(131, 217, 142);
                color: white;
                border: none;
                padding: 10px;
                font-size: 15px;
            "
            >
            Tạo Link thanh toán
        </button> 
    `;
    }
  };
});

const modal = document.getElementById("classModal");
const closeBtn = document.getElementsByClassName("close")[0];

async function viewClasses(courseId) {
  try {
    console.log(courseId);
    const response = await fetch(
      `http://localhost:3000/student/classes/${courseId}`
    );
    const classes = await response.json();

    const courseCard = document.querySelector(`[data-course-id="${courseId}"]`);
    const courseName = courseCard.querySelector("h3").textContent;

    document.getElementById("selectedCourseName").textContent = courseName;

    const classList = document.getElementById("classList");
    classList.innerHTML = classes
      .map(
        (cls) => `
        <div class="class-item">
          <div class="class-details">
            <p>Professor: ${cls.teacher_name}</p> 
          
            <p>Room: ${cls.room_id}</p> 
          
            <p>Class ID: ${cls.class_id}</p> 
            <p>Semester: ${cls.semester}</p> 
            <p>Time Start: ${cls.class_time_start}</p> 
            <p>Time End: ${cls.class_time_end}</p> 
            <p>Day: ${cls.class_time_day}</p> 
          </div>
          <button 
            class="register-btn" 
            onclick="registerForClass('${cls.class_id}', '${courseId}')"
          >
            Register
          </button>
        </div>
      `
      )
      .join("");

    modal.style.display = "block";
  } catch (error) {
    console.error("Error fetching classes:", error);
  }
}

async function registerForClass(classId, courseId) {
  try {
    const response = await fetch("/student/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ classId, courseId }),
    });

    const result = await response.json();
    console.log(result);

    if (result.success) {
      alert("Successfully registered for the class!");
      modal.style.display = "none";
    } else {
      alert(result.message || "Failed to register for the class");
    }
  } catch (error) {
    console.error("Error registering for class:", error);
    alert("Failed to register for the class");
  }
}

closeBtn.onclick = function () {
  modal.style.display = "none";
};

window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
};

document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("courseSearch");
  const courseCards = document.querySelectorAll(".course-card");
  const noResults = document.getElementById("noResults");
  const resultsCount = document.querySelector(".results-count");
  let debounceTimer;

  console.log(courseCards);

  function updateSearchResults() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    let visibleCount = 0;

    courseCards.forEach((card) => {
      const courseId = card.dataset.courseId.toLowerCase();
      const courseName = card.querySelector("h3").textContent.toLowerCase();
      const isMatch =
        courseId.includes(searchTerm) || courseName.includes(searchTerm);

      card.style.display = isMatch ? "block" : "none";
      if (isMatch) visibleCount++;
    });

    // Update results count and visibility
    if (searchTerm === "") {
      resultsCount.textContent = `Showing all ${courseCards.length} courses`;
    } else {
      resultsCount.textContent = `Found ${visibleCount} course${
        visibleCount !== 1 ? "s" : ""
      }`;
    }

    // Show/hide no results message
    noResults.style.display = visibleCount === 0 ? "block" : "none";
  }

  // Add event listener with debounce
  searchInput.addEventListener("input", function () {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(updateSearchResults, 300);
  });

  // Initialize results count
  updateSearchResults();
});
