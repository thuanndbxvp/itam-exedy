# ACCEPTANCE: Sprint C.9 - Asset & License Assignment Validation

## 1. UI Assets List
- **Given** I am an IT Staff
- **When** I view the list of Assets in `/assets`
- **And** there is an Asset with a status that has `deployable: false`
- **Then** the "Cấp phát" (Checkout) button for that Asset must be disabled (grayed out) or hidden.
- **And** it should display a tooltip explaining why (e.g., "Thiết bị không ở trạng thái sẵn sàng").

## 2. UI Asset Details
- **Given** I am an IT Staff viewing an Asset Detail page (`/assets/[id]`)
- **When** the Asset's status is `deployable: false`
- **Then** the "Cấp phát" button in the action bar must be disabled.

## 3. UI License Seats
- **Given** I am an IT Staff viewing License Seats (`/licenses/[id]`)
- **When** the License `expirationDate` is in the past AND `reassignable` is false
- **Then** the "Cấp phát" button for all vacant seats must be disabled.

## 4. Backend Asset Target Validation
- **Given** I have a RAM module ready to be checked out
- **When** I try to check it out to a Target Asset (Server) that has a status with `archived: true`
- **Then** the API must reject with `InvalidStateError` and a message stating that the target asset is archived/disposed.

## 5. Backend License Target Validation
- **Given** I have a License Seat ready to be checked out
- **When** I try to check it out to a Target Asset that has a status with `archived: true`
- **Then** the API must reject with `InvalidStateError` and a message stating that the target asset is archived/disposed.
