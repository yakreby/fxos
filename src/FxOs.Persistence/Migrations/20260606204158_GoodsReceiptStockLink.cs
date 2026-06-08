using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FxOs.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class GoodsReceiptStockLink : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "GoodsReceiptId",
                table: "StockMovements",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ShelfId",
                table: "GoodsReceiptLines",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_StockMovements_GoodsReceiptId",
                table: "StockMovements",
                column: "GoodsReceiptId");

            migrationBuilder.CreateIndex(
                name: "IX_GoodsReceiptLines_ShelfId",
                table: "GoodsReceiptLines",
                column: "ShelfId");

            migrationBuilder.AddForeignKey(
                name: "FK_GoodsReceiptLines_Shelves_ShelfId",
                table: "GoodsReceiptLines",
                column: "ShelfId",
                principalTable: "Shelves",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_GoodsReceiptLines_Shelves_ShelfId",
                table: "GoodsReceiptLines");

            migrationBuilder.DropIndex(
                name: "IX_StockMovements_GoodsReceiptId",
                table: "StockMovements");

            migrationBuilder.DropIndex(
                name: "IX_GoodsReceiptLines_ShelfId",
                table: "GoodsReceiptLines");

            migrationBuilder.DropColumn(
                name: "GoodsReceiptId",
                table: "StockMovements");

            migrationBuilder.DropColumn(
                name: "ShelfId",
                table: "GoodsReceiptLines");
        }
    }
}
