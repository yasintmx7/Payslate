// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ArcInvoice
 * @dev Secure, static invoice system for Arc Network (USDC-native).
 */
contract ArcInvoice is ReentrancyGuard {
    struct Invoice {
        address seller;
        address payer;
        uint256 amount;
        uint64 expiry;
        bool paid;
        bytes32 noteHash;
        string note;
    }

    mapping(uint256 => Invoice) public invoices;
    uint256 public nextInvoiceId = 1;

    event InvoiceCreated(uint256 indexed invoiceId, address indexed seller, uint256 amount, uint64 expiry, string notePreview);
    event InvoicePaid(uint256 indexed invoiceId, address indexed seller, address indexed payer, uint256 amount);
    event InvoiceCancelled(uint256 indexed invoiceId, address indexed seller);

    function createInvoice(
        uint256 amount,
        uint64 expiry,
        bytes32 noteHash,
        string calldata note
    ) external returns (uint256) {
        require(amount > 0, "Amount must be > 0");
        require(expiry > block.timestamp, "Expiry must be in future");

        uint256 invoiceId = nextInvoiceId++;
        invoices[invoiceId] = Invoice({
            seller: msg.sender,
            payer: address(0),
            amount: amount,
            expiry: expiry,
            paid: false,
            noteHash: noteHash,
            note: note
        });

        emit InvoiceCreated(invoiceId, msg.sender, amount, expiry, note);
        return invoiceId;
    }

    function payInvoice(uint256 invoiceId) external payable nonReentrant {
        Invoice storage invoice = invoices[invoiceId];
        require(invoice.seller != address(0), "Invoice does not exist");
        require(!invoice.paid, "Invoice already paid");
        require(block.timestamp <= invoice.expiry, "Invoice expired");
        require(msg.value == invoice.amount, "Incorrect payment amount");

        invoice.paid = true;
        invoice.payer = msg.sender;

        (bool success, ) = payable(invoice.seller).call{value: msg.value}("");
        require(success, "Transfer failed");

        emit InvoicePaid(invoiceId, invoice.seller, msg.sender, invoice.amount);
    }

    function cancelInvoice(uint256 invoiceId) external {
        Invoice storage invoice = invoices[invoiceId];
        require(invoice.seller == msg.sender, "Only seller can cancel");
        require(!invoice.paid, "Already paid");
        
        // Mark as "expired" or effectively invalid
        invoice.expiry = uint64(block.timestamp); 
        
        emit InvoiceCancelled(invoiceId, msg.sender);
    }

    function getInvoice(uint256 invoiceId) external view returns (Invoice memory) {
        return invoices[invoiceId];
    }
}
