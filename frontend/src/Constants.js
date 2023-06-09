const prod = {
    url: {
        API_URL: "https://johng.pythonanywhere.com",
    },
};

const dev = {
    url: {
        API_URL: "http://localhost:8000",
    },
};

export const config = process.env.NODE_ENV === "development" ? dev : prod;
