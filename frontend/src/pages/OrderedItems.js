import React, { useEffect, useState, useContext } from "react";
import {
    CardElement,
    useElements,
    useStripe,
    PaymentElement,
} from "@stripe/react-stripe-js";
import { Link, useNavigate } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import InputGroup from "react-bootstrap/InputGroup";
import Spinner from "react-bootstrap/Spinner";
import Alert from "react-bootstrap/Alert";
import SavedItem from "../components/SavedItem";
import AuthContext from "../context/AuthContext";
import { config } from "../Constants";

const url = config.url.API_URL;

const OrderItems = () => {
    const navigate = useNavigate();
    const { accessToken, deleteOrderItem, updateStockOnDelete } =
        useContext(AuthContext);
    const [order, setOrder] = useState([]);
    const [customerInfo, setCustomerInfo] = useState([]);
    const [items, setItems] = useState(null);
    const [sumOfItems, setSumOfItems] = useState(0);
    const [shipping, setShipping] = useState(5.99);
    const [itemDetailList, setItemDetailList] = useState([]);
    //const [number, setNumber] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalSum, setTotalSum] = useState(0);
    const [shippingSum, setShippingSum] = useState(0);
    const [taxSum, setTaxSum] = useState(0);
    const [shippingInfo, setShippingInfo] = useState([]);
    const [billingInfo, setBillingInfo] = useState([]);
    const [itemIdNum, setItemidNum] = useState([]);
    const [error, setError] = useState(null);
    const [spinner, setSpinner] = useState(null);
    const [changedItemId, setChangedItemId] = useState(null);
    //const [showButton, setShowButton] = useState(false);
    const stripe = useStripe();
    const elements = useElements();

    const caTaxRateSum = 7.25 / 100;

    useEffect(() => {
        getOrderedItems();
        getShipping();
    }, []);

    const getShipping = async () => {
        const requestOptions = {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
        };
        const response = await fetch(`${url}/shipping/`, requestOptions);
        const data = await response.json();
        const shipping_address = data.filter(
            (item) => item.address_type == "S" && item.default == true
        );
        const billing_address = data.filter(
            (item) => item.address_type == "B" && item.default == true
        );
        setShippingInfo(shipping_address);
        setBillingInfo(billing_address);
    };

    const getOrderedItems = async () => {
        setSpinner(true);
        const requestOptions = {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
        };
        const response = await fetch(`${url}/order/`, requestOptions);
        const data = await response.json();
        const dataItems = data.order_items;

        setOrder(data);
        const allOrderedItems = data.map((item) => setItems(item.order_items));
        //const singleOrderItems = data.map((item) =>
        //    setItemDetailList(item.order_items.item_detail)
        //);

        //const allTotal = data.map((item) => setTotal(item.get_total));
        const allTotal = data.map((item) => item.get_total);

        const convertTotalToNumber = parseFloat(allTotal);
        setTotalSum(convertTotalToNumber);

        const orderId = order.id;
        //const allTotal = data.get_total;

        const allTotalShipping = convertTotalToNumber + shipping;
        setShippingSum(allTotalShipping);

        const fullTaxSum = caTaxRateSum * allTotalShipping;
        setTaxSum(fullTaxSum);

        const fullTotalSum = allTotalShipping + fullTaxSum;

        setTotal(fullTotalSum);

        const info = data.map((customer) => customer.get_address);
        if (items != null) {
            const numItems = items.map((item) => item.quantity);
            const sum = numItems.reduce((a, b) => a + b, 0);
            setSumOfItems(sum);
        }
        //console.log("numItems", numItems);
        //setNumberOfItems(getNumItems);
        setCustomerInfo(info);

        const fullTotal = setTimeout(() => {
            setSpinner(false);
        }, 2000);
    };

    //const getNumItems = items.map((item) => item.quantity);
    //console.log("num of items", getNumItems);
    /*
    const getSum = () => {
        const numItems = items.map((item) => item.quantity);
        console.log("numItems", numItems);
        const sum = numItems.reduce((a, b) => a + b, 0);
        console.log("sum", sum);
    };

    if (items != null) {
        getSum();
        console.log("getSum", getSum());
    }
    */

    const handleDelete = (e, orderId, itemId) => {
        const singleOrderItems = items.map((item) => item.item_detail);
        updateStockOnDelete(orderId, itemId, singleOrderItems, items);
        deleteOrderItem(e, orderId);
        removeItem(orderId);
    };

    const removeItem = async (id) => {
        const newList = items.filter((item) => item.id !== id);

        const remainingPrices = newList.map(
            (item) => item.get_total_item_price
        );
        //console.log("remaining prices", remainingPrices);

        const stringToNum = remainingPrices.map((str) => {
            return Number(str);
        });
        //console.log("string to num", stringToNum);

        const remainingTotalPrice = stringToNum.reduce(
            (total, item) => total + item,
            0
        );
        //console.log("remaining total price", remainingTotalPrice);

        setTotalSum(remainingTotalPrice.toFixed(2));

        const allTotalShipping = remainingTotalPrice + shipping;
        //console.log("allTotalShipping", allTotalShipping);

        setShippingSum(allTotalShipping);

        const fullTaxSum = caTaxRateSum * allTotalShipping;
        //console.log("full tax sum", fullTaxSum);

        setTaxSum(fullTaxSum);

        setTotal(allTotalShipping + fullTaxSum);

        setItems(newList);

        //1.46
        //1.44
        //1.45
        //1.45
        //1.45
    };

    const updateItemAPIs = (ids) => {
        ids.forEach((id) => {
            const itemId = items.find((item) => item.id === id);
            const originalItemId = itemId.item_detail.id;
            const stockNum = itemId.item_detail.sold;
            const itemQuantity = itemId.quantity;
            const response = fetch(`${url}/items/${originalItemId}/`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    sold: stockNum + itemQuantity,
                }),
            });
        });
    };

    /*
    function handleQuantityChange(itemId, newQuantity) {
        setItems(
            items.map((item) => {
                if (item.id === itemId) {
                    const prevQuantity = item.quantity;
                    const newStock =
                        item.item_detail.stock + (prevQuantity - newQuantity);
                    setChangedItemId(itemId);
                    return {
                        ...item,
                        quantity: newQuantity,
                        item_detail: { ...item.item_detail, stock: newStock },
                    };
                } else {
                    return item;
                }
            })
        );
    }
    */

    /*
    function handleQuantityChange(itemId, newQuantity) {
        //setShowButton(true);
        const updatedItems = items.map((item) => {
            if (item.id === itemId) {
                const prevQuantity = Number(item.quantity);
                const newStock =
                    item.item_detail.stock +
                    (prevQuantity - Number(newQuantity));
                const isInputValid = newQuantity < item.item_detail.stock_limit;
                const hasQuantityChanged = prevQuantity !== Number(newQuantity);
                const showButton = hasQuantityChanged && isInputValid;
                return {
                    ...item,
                    quantity: Number(newQuantity),
                    item_detail: { ...item.item_detail, stock: newStock },
                    showButton: showButton,
                };
            } else {
                return item;
            }
        });
        setChangedItemId(itemId);
        setItems(updatedItems);
    }
    */

    function handleQuantityChange(itemId, newQuantity) {
        //setShowButton(true);
        const updatedItems = items.map((item) => {
            if (item.id === itemId) {
                //setIsInputValid(newQuantity < item.item_detail.stock_limit);
                const prevQuantity = Number(item.quantity);
                const prevStock = item.item_detail.stock;
                const newStock =
                    item.item_detail.stock +
                    (prevQuantity - Number(newQuantity));
                //const isInputValid =
                //    newQuantity <= item.quantity + item.item_detail.stock;
                //const hasQuantityChanged = prevQuantity !== Number(newQuantity);
                const showButton = prevQuantity !== Number(newQuantity);
                return {
                    ...item,
                    quantity: Number(newQuantity),
                    newStock: newStock,
                    prevQuantity: prevQuantity,
                    prevStock: prevStock,
                    showButton: showButton,
                };
            } else {
                return item;
            }
        });
        setChangedItemId(itemId);
        setItems(
            updatedItems.map((item) => {
                if (item.id === itemId) {
                    //const hasQuantityChanged =
                    //    item.quantity !== item.item_detail.stock;
                    //const exceedLimit = item.quantity > item.item_detail.stock;
                    //const showAlert = hasQuantityChanged && exceedLimit;
                    return {
                        ...item,
                        item_detail: {
                            ...item.item_detail,
                            stock: item.newStock,
                        },
                        //showAlert: showAlert,
                    };
                } else {
                    return item;
                }
            })
        );
    }

    const handleSubmit = async (e, orderId, itemOrderId) => {
        e.preventDefault();
        const singleOrder = items.find((item) => item.id === changedItemId);
        if (
            singleOrder.quantity >
            singleOrder.quantity + singleOrder.item_detail.stock
        ) {
            const updatedItems = items.map((item) =>
                item.id === singleOrder.id
                    ? { ...item, alertShown: true }
                    : item
            );
            setItems(updatedItems);
            //setShowAlert(true);
            return;
        }

        if (singleOrder.quantity === 0) {
            handleDelete(e, singleOrder.id, singleOrder.item_detail.id);
        } else if (itemOrderId === changedItemId) {
            updateItem(singleOrder);
            if (singleOrder.item_detail.stock >= 0) {
                const requestOptions = {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${accessToken}`,
                        //"X-CSRFToken": csrftoken,
                    },
                    //credentials: "include",
                    body: JSON.stringify({
                        quantity: Number(singleOrder.quantity),
                        item: singleOrder.item_detail.url,
                    }),
                };
                const response = await fetch(
                    `${url}/order-item/${singleOrder.id}/`,
                    requestOptions
                );
                const data = await response.json();
                //setOrderCreated(data);
                //if (!data.detail) {
                getOrderedItems();
                //getShipping();
                //navigate("/order-item/");
                //}
            } else {
                throw new Error(
                    "Item's stock limit is " +
                        singleOrder.item_detail.stock +
                        "."
                );
            }
        }
    };
    const updateItem = async (order) => {
        const requestOptions = {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
                stock: Number(order.item_detail.stock),
            }),
        };
        const response = await fetch(
            `${url}/items/${order.item_detail.id}/`,
            requestOptions
        );
        const data = await response.json();
    };

    const updateOrder = async (e) => {
        e.preventDefault();
        const itemIds = items.map((item) => item.id);
        const orderId = order.map((num) => num.id);
        const date = new Date();

        const card = elements.getElement(CardElement);

        const { paymentMethod } = await stripe.createPaymentMethod({
            type: "card",
            card: card,
        });

        const requestOptions = {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
                ordered: true,
                ordered_date: date,
                total: total,
                payment_method_id: paymentMethod.id,
            }),
        };
        const response = await fetch(
            `${url}/order/${orderId}/`,
            requestOptions
        );
        const data = await response.json();
        updateItemAPIs(itemIds);
        setItems("");
        navigate("/order-placed/");
    };

    const handleChange = (e) => {
        if (e.error) {
            setError(e.error.message);
        } else {
            setError(null);
        }
    };
    /*
    const inputStyle = {
        iconColor: "#c4f0ff",
        color: "#fff",
        fontWeight: "500",
        fontFamily: "Roboto, Open Sans, Segoe UI, sans-serif",
        fontSize: "15px",
        fontSmoothing: "antialiased",
        ":-webkit-autofill": {
            color: "#fce883",
        },
        "::placeholder": {
            color: "#87BBFD",
        },
        invalid: {
            iconColor: "#FFC7EE",
            color: "#FFC7EE",
        },
    };
    */

    const cardElementOptions = {
        style: {
            base: {
                fontSize: "16px",
                color: "#32325d",
                "::placeholder": {
                    color: "#aab7c4",
                },
            },
            invalid: {
                color: "#fa755a",
            },
        },
    };

    //const convertTotalToNum = parseFloat(total);

    //const totalSum = convertTotalToNum + shipping;
    //console.log("totalSum", totalSum);
    //console.log("total", convertTotalToNum);
    //console.log("shipping", shipping);

    //const caTaxRateSum = (7.25 / 100) * totalSum;
    //console.log("tax rate", caTaxRateSum);

    //const fullTotalSum = totalSum + caTaxRateSum;
    //console.log("full sum", fullTotalSum);

    // Order items

    return (
        <Container className="mt-4 mb-5">
            {spinner ? (
                <>
                    <Spinner></Spinner>
                </>
            ) : (
                <>
                    {items === null ? (
                        <></>
                    ) : items.length >= 1 ? (
                        <div className="mt-5 mb-3 d-flex gap-3 justify-content-evenly align-items-baseline main-place-order-div">
                            <div className="main-ordered-items-div">
                                <Row className="mb-3 d-flex order-shipping-row">
                                    <Col>
                                        <h3>Shipping address</h3>
                                    </Col>
                                    <Col>
                                        {shippingInfo.map((info) => (
                                            <div key={info.id}>
                                                <div>
                                                    <p>
                                                        {info.address},{" "}
                                                        {info.apt}, {info.city},{" "}
                                                        {info.state},{" "}
                                                        {info.zipcode}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </Col>
                                    <Col>
                                        {" "}
                                        <Link
                                            to="/shipping"
                                            state={{ from: "/ordered-items/" }}
                                        >
                                            {shippingInfo.length > 0 ? (
                                                <p>Change</p>
                                            ) : (
                                                <p>Add a shipping address.</p>
                                            )}
                                        </Link>
                                    </Col>
                                </Row>
                                <hr />

                                <h4 className="mb-3">Review Items</h4>
                                {items.map((item) => (
                                    <div key={item.id}>
                                        {" "}
                                        {item.alertShown && (
                                            <Alert
                                                id={item.id}
                                                variant="danger"
                                            >
                                                Stock limit is{" "}
                                                {item.prevQuantity +
                                                    item.prevStock}
                                            </Alert>
                                        )}
                                        <Card className="mb-2" key={item.id}>
                                            <Container>
                                                <Row className="purchase-item-info">
                                                    <Col>
                                                        <div>
                                                            <Card.Img
                                                                src={
                                                                    item
                                                                        .item_detail
                                                                        .image
                                                                }
                                                                style={{
                                                                    width: "200px",
                                                                }}
                                                            />
                                                        </div>
                                                    </Col>
                                                    <Col className="mid-col-checkout">
                                                        <p>
                                                            {
                                                                item.item_detail
                                                                    .name
                                                            }
                                                        </p>
                                                        <p>
                                                            {
                                                                item.item_detail
                                                                    .description
                                                            }
                                                        </p>

                                                        <div className="qty-btn-group">
                                                            <div className="mb-2">
                                                                <Form>
                                                                    <InputGroup className="item-purchase-input">
                                                                        <Form.Control
                                                                            type="number"
                                                                            inputMode="numeric"
                                                                            id="number2"
                                                                            min={
                                                                                1
                                                                            }
                                                                            value={
                                                                                item.quantity
                                                                            }
                                                                            max={
                                                                                item
                                                                                    .item_detail
                                                                                    .stock_limit
                                                                            }
                                                                            onChange={(
                                                                                e
                                                                            ) =>
                                                                                handleQuantityChange(
                                                                                    item.id,
                                                                                    e
                                                                                        .target
                                                                                        .value
                                                                                )
                                                                            }
                                                                        />
                                                                        <InputGroup.Text>
                                                                            Qty.
                                                                        </InputGroup.Text>
                                                                    </InputGroup>{" "}
                                                                </Form>{" "}
                                                            </div>
                                                            {item.showButton && (
                                                                <div className="mb-2">
                                                                    <Button
                                                                        style={{
                                                                            width: "95%",
                                                                        }}
                                                                        onClick={(
                                                                            e
                                                                        ) =>
                                                                            handleSubmit(
                                                                                e,
                                                                                item
                                                                                    .item_detail
                                                                                    .id,
                                                                                item.id
                                                                            )
                                                                        }
                                                                    >
                                                                        Update
                                                                    </Button>
                                                                </div>
                                                            )}
                                                            <div>
                                                                <Form>
                                                                    <Button
                                                                        style={{
                                                                            width: "95%",
                                                                        }}
                                                                        variant="danger"
                                                                        onClick={(
                                                                            e
                                                                        ) =>
                                                                            handleDelete(
                                                                                e,
                                                                                item.id,
                                                                                item
                                                                                    .item_detail
                                                                                    .id
                                                                            )
                                                                        }
                                                                    >
                                                                        Delete
                                                                    </Button>
                                                                </Form>
                                                            </div>{" "}
                                                        </div>
                                                    </Col>
                                                </Row>
                                            </Container>
                                        </Card>
                                    </div>
                                ))}
                            </div>
                            <Card className="payment-div">
                                <Container>
                                    <h3>Order Summary</h3>
                                    <div className="order-sum-p">
                                        <p>Items Total</p> <p>${totalSum}</p>
                                    </div>
                                    <div className="order-sum-p">
                                        <p>Shipping and Handling</p>{" "}
                                        <p> ${shipping}</p>
                                    </div>
                                    <div className="order-sum-p">
                                        <p>Total before tax:</p>{" "}
                                        <p>${shippingSum.toFixed(2)}</p>
                                    </div>
                                    <div className="order-sum-p">
                                        <p>Estimated tax to be collected:</p>
                                        <p>${taxSum.toFixed(2)}</p>
                                    </div>
                                </Container>
                                <hr />
                                <div className="order-sum-content">
                                    <h5>Order total: ${total.toFixed(2)}</h5>
                                </div>
                                <hr />
                                <Container>
                                    <Form onSubmit={updateOrder}>
                                        <div className="form-row">
                                            <label htmlFor="card-element">
                                                Credit or debit card
                                            </label>
                                            <CardElement
                                                id="card-element"
                                                options={cardElementOptions}
                                                onChange={handleChange}
                                            />
                                            <div
                                                className="card-error"
                                                role="alert"
                                            >
                                                {error}
                                            </div>
                                        </div>
                                        <Button
                                            className="p-checkout-btn"
                                            variant="success"
                                            type="submit"
                                        >
                                            Place Order
                                        </Button>
                                    </Form>
                                </Container>
                            </Card>
                        </div>
                    ) : (
                        <div className="no-items-cart">
                            <h2>No items to order.</h2>

                            <Link to="/">
                                <Button className="mb-5" variant="info">
                                    Add some items.
                                </Button>
                            </Link>
                        </div>
                    )}
                </>
            )}
        </Container>
    );
};

export default OrderItems;
