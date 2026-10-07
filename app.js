const todayElement = document.getElementById("today");

const takkyubinInput = document.getElementById("takkyubin");
const nekoposInput = document.getElementById("nekopos");

const saveButton = document.getElementById("saveButton");

const inputScreen = document.getElementById("inputScreen");
const summaryScreen = document.getElementById("summaryScreen");
const settingsScreen = document.getElementById("settingsScreen");

const summaryMonth = document.getElementById("summaryMonth");
const takkyubinTotal = document.getElementById("takkyubinTotal");
const nekoposTotal = document.getElementById("nekoposTotal");
const salesTotal = document.getElementById("salesTotal");

const dailyRecords =
  document.getElementById("dailyRecords");

const pastDateInput =
  document.getElementById("pastDateInput");

const pastDateButton =
  document.getElementById("pastDateButton");

const prevMonthButton =
  document.getElementById("prevMonthButton");

const nextMonthButton =
  document.getElementById("nextMonthButton");

const takkyubinPriceInput = document.getElementById("takkyubinPrice");
const nekoposPriceInput = document.getElementById("nekoposPrice");
const saveSettingsButton = document.getElementById("saveSettingsButton");

const exportBackupButton =
  document.getElementById("exportBackupButton");

  const importBackupButton =
  document.getElementById("importBackupButton");

const importBackupInput =
  document.getElementById("importBackupInput");

const toast =
  document.getElementById("toast");

const inputNav = document.getElementById("inputNav");
const summaryNav = document.getElementById("summaryNav");
const settingsNav = document.getElementById("settingsNav");

const dialogOverlay =
  document.getElementById("dialogOverlay");

const dialogMessage =
  document.getElementById("dialogMessage");

const dialogCancelButton =
  document.getElementById("dialogCancelButton");

const dialogOkButton =
  document.getElementById("dialogOkButton");

const now = new Date();

let summaryYear = now.getFullYear();
let summaryMonthIndex = now.getMonth();

const formatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "short"
});

todayElement.textContent = formatter.format(now);


function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const todayKey = getDateKey(now);

let selectedDateKey = todayKey;


let toastTimer = null;

function showToast(message) {
  toast.textContent = message;

  toast.classList.add("show");

  if (toastTimer) {
    clearTimeout(toastTimer);
  }

  toastTimer = setTimeout(function () {
    toast.classList.remove("show");
  }, 1800);
}


function showConfirmDialog(message) {
  return new Promise(function (resolve) {
    dialogMessage.textContent = message;

    dialogOverlay.classList.add("show");

    function closeDialog(result) {
      dialogOverlay.classList.remove("show");

      dialogOkButton.removeEventListener(
        "click",
        onOk
      );

      dialogCancelButton.removeEventListener(
        "click",
        onCancel
      );

      resolve(result);
    }

    function onOk() {
      closeDialog(true);
    }

    function onCancel() {
      closeDialog(false);
    }

    dialogOkButton.addEventListener(
      "click",
      onOk
    );

    dialogCancelButton.addEventListener(
      "click",
      onCancel
    );
  });
}


function loadSelectedRecord() {
  const savedData =
    localStorage.getItem("deliveryRecords");

  let records = {};

  if (savedData) {
    records = JSON.parse(savedData);
  }

  const record = records[selectedDateKey];

  if (record) {
    takkyubinInput.value =
      record.takkyubin;

    nekoposInput.value =
      record.nekopos;

    saveButton.textContent = "更新";
  } else {
    takkyubinInput.value = "";
    nekoposInput.value = "";

    saveButton.textContent = "登録";
  }

  updateInputDate();
}

function openPastDateEntry() {
  const selectedDate =
    pastDateInput.value;

  if (!selectedDate) {
    showToast("日付を選択してください");
    return;
  }

  if (selectedDate > todayKey) {
    showToast("未来の日付は登録できません");
    return;
  }

  selectedDateKey = selectedDate;

  loadSelectedRecord();

  showScreen("input");
}

function updateInputDate() {
  const parts = selectedDateKey.split("-");

  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  const date = new Date(
    year,
    month - 1,
    day
  );

  todayElement.textContent =
    formatter.format(date);
}


function loadSettings() {
  const savedSettings = localStorage.getItem("deliverySettings");

  if (!savedSettings) {
    return;
  }

  const settings = JSON.parse(savedSettings);

  takkyubinPriceInput.value = settings.takkyubinPrice ?? "";
  nekoposPriceInput.value = settings.nekoposPrice ?? "";
}

function saveSettings() {
  const settings = {
    takkyubinPrice: Number(takkyubinPriceInput.value),
    nekoposPrice: Number(nekoposPriceInput.value)
  };

  localStorage.setItem(
    "deliverySettings",
    JSON.stringify(settings)
  );

  showToast("✓ 設定を保存しました");
}


function exportBackup() {
  const savedRecords =
    localStorage.getItem("deliveryRecords");

  const savedSettings =
    localStorage.getItem("deliverySettings");

  const backupData = {
    version: 1,
    exportedAt: new Date().toISOString(),

    settings: savedSettings
      ? JSON.parse(savedSettings)
      : {},

    records: savedRecords
      ? JSON.parse(savedRecords)
      : {}
  };

  const jsonText =
    JSON.stringify(backupData, null, 2);

  const blob = new Blob(
    [jsonText],
    { type: "application/json" }
  );

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  const today =
    getDateKey(new Date());

  link.href = url;

  link.download =
    `delivery-backup-${today}.json`;

  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}


function openBackupFilePicker() {
  importBackupInput.value = "";
  importBackupInput.click();
}


async function importBackup(event) {
  const file = event.target.files[0];

  if (!file) {
    return;
  }

  const reader = new FileReader();

  reader.onload = async function () {
    try {
      const backupData =
        JSON.parse(reader.result);

      if (
        typeof backupData !== "object" ||
        backupData === null ||
        typeof backupData.settings !== "object" ||
        typeof backupData.records !== "object"
      ) {
        showToast(
          "このファイルは有効なバックアップではありません"
        );
        return;
      }

      const confirmed =
        await showConfirmDialog(
          "現在のデータをバックアップ内容で置き換えます。よろしいですか？"
        );

      if (!confirmed) {
        return;
      }

      localStorage.setItem(
        "deliverySettings",
        JSON.stringify(backupData.settings)
      );

      localStorage.setItem(
        "deliveryRecords",
        JSON.stringify(backupData.records)
      );

      selectedDateKey = todayKey;

      loadSettings();
      loadSelectedRecord();
      updateMonthlySummary();

      showToast("✓ バックアップを復元しました");

      showScreen("input");

    } catch (error) {
      showToast(
        "バックアップファイルを読み込めませんでした"
      );

      console.error(error);
    }
  };

  reader.readAsText(file);
}


function updateMonthlySummary() {
  const savedData = localStorage.getItem("deliveryRecords");

  let records = {};

  if (savedData) {
    records = JSON.parse(savedData);
  }

  let takkyubinCount = 0;
  let nekoposCount = 0;
  let totalSales = 0;

  const monthlyRecords = [];

  const targetMonth =
    `${summaryYear}-${String(summaryMonthIndex + 1).padStart(2, "0")}`;

  for (const dateKey in records) {

    if (!dateKey.startsWith(targetMonth)) {
      continue;
    }

    const record = records[dateKey];

    monthlyRecords.push({
    dateKey: dateKey,
    record: record
    });

    const takkyubin =
      Number(record.takkyubin || 0);

    const nekopos =
      Number(record.nekopos || 0);

    const takkyubinPrice =
      Number(record.takkyubinPrice || 0);

    const nekoposPrice =
      Number(record.nekoposPrice || 0);

    takkyubinCount += takkyubin;
    nekoposCount += nekopos;

    totalSales +=
      takkyubin * takkyubinPrice +
      nekopos * nekoposPrice;
  }

  summaryMonth.textContent =
    `${summaryYear}年${summaryMonthIndex + 1}月`;

  takkyubinTotal.textContent =
    `${takkyubinCount.toLocaleString()} 個`;

  nekoposTotal.textContent =
    `${nekoposCount.toLocaleString()} 個`;

    salesTotal.textContent =
    `${totalSales.toLocaleString()} 円`;

    updateDailyRecords(monthlyRecords);

    updateMonthButtons(records);
}


function updateDailyRecords(monthlyRecords) {

  dailyRecords.innerHTML = "";

  if (monthlyRecords.length === 0) {

    const message =
      document.createElement("p");

    message.className = "no-records";
    message.textContent =
      "この月の記録はありません";

    dailyRecords.appendChild(message);

    return;
  }


  monthlyRecords.sort(function (a, b) {
    return b.dateKey.localeCompare(a.dateKey);
  });


  for (const item of monthlyRecords) {

    const button =
      document.createElement("button");

    button.type = "button";
    button.className = "daily-record";


    const day =
      Number(item.dateKey.slice(8, 10));

    const takkyubin =
      Number(item.record.takkyubin || 0);

    const nekopos =
      Number(item.record.nekopos || 0);


    button.textContent =
      `${day}日　宅急便 ${takkyubin}　ネコポス ${nekopos}`;

    if (takkyubin === 0 && nekopos === 0) {
      button.classList.add("zero-record");
    }

    button.addEventListener(
      "click",
      function () {

        selectedDateKey =
          item.dateKey;

        loadSelectedRecord();

        showScreen("input");
      }
    );


    dailyRecords.appendChild(button);
  }
}


function changeMonth(amount) {
  summaryMonthIndex += amount;

  if (summaryMonthIndex < 0) {
    summaryMonthIndex = 11;
    summaryYear--;
  }

  if (summaryMonthIndex > 11) {
    summaryMonthIndex = 0;
    summaryYear++;
  }

  updateMonthlySummary();
}


function updateMonthButtons(records) {
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const isCurrentMonth =
    summaryYear === currentYear &&
    summaryMonthIndex === currentMonth;

  nextMonthButton.disabled = isCurrentMonth;


  const recordMonths = Object.keys(records)
    .map(function (dateKey) {
      return dateKey.slice(0, 7);
    })
    .sort();

  if (recordMonths.length === 0) {
    prevMonthButton.disabled = true;
    return;
  }

  const oldestMonth = recordMonths[0];

  const displayedMonth =
    `${summaryYear}-${String(summaryMonthIndex + 1).padStart(2, "0")}`;

  prevMonthButton.disabled =
    displayedMonth <= oldestMonth;
}


async function saveTodayRecord() {
  const takkyubinText = takkyubinInput.value.trim();
  const nekoposText = nekoposInput.value.trim();

  if (takkyubinText === "" || nekoposText === "") {
    showToast("宅急便とネコポスの両方を入力してください");
    return;
  }

  const takkyubin = Number(takkyubinText);
  const nekopos = Number(nekoposText);

  if (
    !Number.isInteger(takkyubin) ||
    !Number.isInteger(nekopos)
  ) {
    showToast("配送個数は整数で入力してください");
    return;
  }

  if (takkyubin < 0 || nekopos < 0) {
    showToast("配送個数にマイナスは入力できません");
    return;
  }

  if (takkyubin > 1000 || nekopos > 1000) {
    const result =
      await showConfirmDialog(
        "1000個を超える数字が入力されています。このまま登録しますか？"
      );

    if (!result) {
      return;
    }
  }

  let records = {};

  const savedData =
    localStorage.getItem("deliveryRecords");

  if (savedData) {
    records = JSON.parse(savedData);
  }

  const oldRecord =
    records[selectedDateKey];

  let takkyubinPrice = 0;
  let nekoposPrice = 0;

  if (oldRecord) {
    takkyubinPrice =
      Number(oldRecord.takkyubinPrice || 0);

    nekoposPrice =
      Number(oldRecord.nekoposPrice || 0);
  } else {
    const savedSettings =
      localStorage.getItem("deliverySettings");

    if (!savedSettings) {
      showToast(
        "単価が設定されていません。\n先に設定画面で単価を登録してください。"
      );

      showScreen("settings");
      return;
    }

    const settings =
      JSON.parse(savedSettings);

    takkyubinPrice =
      Number(settings.takkyubinPrice);

    nekoposPrice =
      Number(settings.nekoposPrice);

    if (
      !Number.isFinite(takkyubinPrice) ||
      !Number.isFinite(nekoposPrice) ||
      takkyubinPrice <= 0 ||
      nekoposPrice <= 0
    ) {
      showToast(
        "単価が正しく設定されていません。\n先に設定画面で単価を登録してください。"
      );

      showScreen("settings");
      return;
    }
  }

  records[selectedDateKey] = {
    takkyubin: takkyubin,
    nekopos: nekopos,
    takkyubinPrice: takkyubinPrice,
    nekoposPrice: nekoposPrice
  };

  localStorage.setItem(
    "deliveryRecords",
    JSON.stringify(records)
  );

  if (selectedDateKey === todayKey) {
    showToast("✓ 登録しました");
  } else {
    showToast("✓ 更新しました");
  }

  loadSelectedRecord();
}


function showScreen(screenName) {

  inputScreen.classList.remove("active");
  summaryScreen.classList.remove("active");
  settingsScreen.classList.remove("active");

  inputNav.classList.remove("active");
  summaryNav.classList.remove("active");
  settingsNav.classList.remove("active");


  if (screenName === "input") {
    inputScreen.classList.add("active");
    inputNav.classList.add("active");
  }

  if (screenName === "summary") {
    summaryScreen.classList.add("active");
    summaryNav.classList.add("active");
  }

  if (screenName === "settings") {
    settingsScreen.classList.add("active");
    settingsNav.classList.add("active");
  }
}


saveButton.addEventListener("click", saveTodayRecord);

saveSettingsButton.addEventListener("click", saveSettings);

exportBackupButton.addEventListener(
  "click",
  exportBackup
);

importBackupButton.addEventListener(
  "click",
  openBackupFilePicker
);

importBackupInput.addEventListener(
  "change",
  importBackup
);

pastDateButton.addEventListener(
  "click",
  openPastDateEntry
);

prevMonthButton.addEventListener("click", function () {
  changeMonth(-1);
});

nextMonthButton.addEventListener("click", function () {
  changeMonth(1);
});

inputNav.addEventListener("click", function () {

  selectedDateKey = todayKey;

  loadSelectedRecord();

  showScreen("input");
});

summaryNav.addEventListener("click", function () {
  updateMonthlySummary();
  showScreen("summary");
});

settingsNav.addEventListener("click", function () {
  showScreen("settings");
});

pastDateInput.max = todayKey;

loadSelectedRecord();
loadSettings();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker
      .register("./service-worker.js")
      .catch(function (error) {
        console.error(
          "Service Worker の登録に失敗しました",
          error
        );
      });
  });
}