import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Container,
  Flex,
  HStack,
  IconButton,
  Image,
  Link,
  Text,
  Drawer,
  Badge,
  Menu,
  Portal,
  VStack,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import {
  LuMenu,
  LuBell,
  LuChevronDown,
  LuBellOff,
  LuSun,
  LuMoon,
} from "react-icons/lu";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
} from "@clerk/clerk-react";
import { useColorMode } from "@/components/ui/color-mode";
import { io } from "socket.io-client";
import axios from "axios";
import { toaster } from "@/components/ui/toaster";

const navLinks = [
  { label: "Nhà đất bán", href: "/sell" },
  { label: "Nhà đất cho thuê", href: "/rent" },
];

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const Navbar = () => {
  const { user } = useUser();
  const { colorMode, toggleColorMode } = useColorMode();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileNoti, setShowMobileNoti] = useState(false);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/notifications/${user.id}`,
        );
        if (res.data?.success) {
          setNotifications(res.data.data);
        }
      } catch (err) {
        console.error("Lỗi lấy lịch sử thông báo:", err);
      }
    };

    fetchNotifications();

    const socket = io(API_BASE_URL);

    socket.on("connect", () => {
      socket.emit("register_user", user.id);
    });

    socket.on("new_notification", (newNoti) => {
      setNotifications((prev) => [newNoti, ...prev]);

      toaster.create({
        title: newNoti.title,
        description: newNoti.message,
        type: "info",
        duration: 5000,
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const handleMarkAllAsRead = async () => {
    if (!user || unreadCount === 0) return;

    try {
      await axios.put(`${API_BASE_URL}/api/notifications/read-all/${user.id}`);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Lỗi cập nhật trạng thái đã đọc:", err);
    }
  };

  return (
    <Box
      as="nav"
      bg={{ base: "#fff", _dark: "gray.950" }}
      borderBottom="1px solid"
      borderColor={{ base: "gray.100", _dark: "whiteAlpha.200" }}
      py={3}
      position="sticky"
      top="0"
      zIndex="1000"
    >
      <Container maxW="container.xl">
        <Flex justify="space-between" align="center">
          <HStack gap={8}>
            <Link as={RouterLink} to="/" _hover={{ textDecoration: "none" }}>
              <HStack gap={2} align="center">
                <Image
                  src="/imgs/logo.png"
                  alt="RealEstate Pro"
                  w="150px"
                  objectFit="contain"
                  style={{
                    filter:
                      colorMode === "dark"
                        ? "invert(1) brightness(1.2)"
                        : "none",
                    transition: "filter 0.2s ease",
                  }}
                />
              </HStack>
            </Link>

            <HStack gap={5} display={{ base: "none", md: "flex" }}>
              {navLinks.map((link, index) => (
                <Link
                  key={index}
                  as={RouterLink}
                  to={link.href}
                  fontSize="sm"
                  fontWeight="500"
                  color={{ base: "gray.700", _dark: "white" }}
                  _hover={{ color: "#E65C00", textDecoration: "none" }}
                >
                  {link.label}
                </Link>
              ))}
            </HStack>
          </HStack>

          <HStack gap={4} position="relative" align="center">
            <SignedIn>
              <HStack
                gap={4}
                display={{ base: "none", md: "flex" }}
                align="center"
              >
                <Menu.Root>
                  <Menu.Trigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      px={2}
                      color={{ base: "gray.700", _dark: "white" }}
                      _hover={{ color: "#E65C00" }}
                    >
                      Quản lý tin
                      <LuChevronDown size={14} style={{ marginLeft: "4px" }} />
                    </Button>
                  </Menu.Trigger>
                  <Portal>
                    <Menu.Positioner>
                      <Menu.Content
                        bg={{ base: "white", _dark: "gray.900" }}
                        borderColor={{
                          base: "gray.200",
                          _dark: "whiteAlpha.200",
                        }}
                      >
                        <Menu.Item
                          value="create"
                          as={RouterLink}
                          to="/create-property"
                        >
                          Đăng tin mới
                        </Menu.Item>
                        <Menu.Item
                          value="manage"
                          as={RouterLink}
                          to="/manage-properties"
                        >
                          Tin của tôi
                        </Menu.Item>
                        <Menu.Item
                          value="favorites"
                          as={RouterLink}
                          to="/favorites"
                        >
                          Tin yêu thích
                        </Menu.Item>
                      </Menu.Content>
                    </Menu.Positioner>
                  </Portal>
                </Menu.Root>

                <Box position="relative" display="flex" align="center">
                  <IconButton
                    variant="ghost"
                    aria-label="Notifications"
                    onClick={() => setShowDropdown(!showDropdown)}
                    style={{ borderRadius: "9999px" }}
                    color={{ base: "gray.700", _dark: "gray.100" }}
                  >
                    <LuBell size={22} />
                    {unreadCount > 0 && (
                      <Badge
                        position="absolute"
                        top="-2px"
                        right="-2px"
                        bg="#E65C00"
                        color="white"
                        fontSize="10px"
                        borderRadius="full"
                        px={1.5}
                      >
                        {unreadCount}
                      </Badge>
                    )}
                  </IconButton>

                  {showDropdown && (
                    <Box
                      position="absolute"
                      top="45px"
                      right="0"
                      bg={{ base: "white", _dark: "gray.900" }}
                      w="340px"
                      boxShadow="xl"
                      borderRadius="lg"
                      borderWidth="1px"
                      borderColor={{
                        base: "gray.200",
                        _dark: "whiteAlpha.200",
                      }}
                      overflow="hidden"
                      zIndex="1100"
                    >
                      <Flex
                        justify="space-between"
                        align="center"
                        p={3}
                        bg={{ base: "gray.50", _dark: "gray.800" }}
                        borderBottomWidth="1px"
                      >
                        <Text
                          fontWeight="bold"
                          fontSize="sm"
                          color={{ base: "gray.800", _dark: "whiteAlpha.900" }}
                        >
                          Thông báo cá nhân
                        </Text>
                        {unreadCount > 0 && (
                          <Text
                            fontSize="xs"
                            color="#E65C00"
                            fontWeight="500"
                            cursor="pointer"
                            onClick={handleMarkAllAsRead}
                          >
                            Đọc tất cả
                          </Text>
                        )}
                      </Flex>

                      <Box maxH="320px" overflowY="auto">
                        {notifications.length === 0 ? (
                          <Text
                            p={4}
                            fontSize="sm"
                            color={{ base: "gray.500", _dark: "gray.300" }}
                            textAlign="center"
                          >
                            Bạn chưa có thông báo nào.
                          </Text>
                        ) : (
                          notifications.map((noti) => (
                            <Box
                              key={noti._id}
                              p={3}
                              borderBottomWidth="1px"
                              borderColor={{
                                base: "gray.100",
                                _dark: "whiteAlpha.200",
                              }}
                              bg={
                                noti.isRead
                                  ? "transparent"
                                  : { base: "orange.50", _dark: "orange.950" }
                              }
                              _hover={{
                                bg: { base: "gray.50", _dark: "gray.800" },
                              }}
                              as={RouterLink}
                              to={`/properties/${noti.propertyId}`}
                              onClick={() => setShowDropdown(false)}
                              display="block"
                            >
                              <Text
                                fontWeight={noti.isRead ? "medium" : "bold"}
                                fontSize="sm"
                                color={{ base: "gray.800", _dark: "gray.100" }}
                                noOfLines={1}
                              >
                                {noti.title}
                              </Text>
                              <Text
                                fontSize="xs"
                                color={{ base: "gray.600", _dark: "gray.300" }}
                                mt={0.5}
                                noOfLines={2}
                              >
                                {noti.message}
                              </Text>
                              <Text
                                fontSize="10px"
                                color={{ base: "gray.400", _dark: "gray.500" }}
                                mt={1}
                              >
                                {new Date(noti.createdAt).toLocaleString(
                                  "vi-VN",
                                )}
                              </Text>
                            </Box>
                          ))
                        )}
                      </Box>
                    </Box>
                  )}
                </Box>

                <Flex align="center" justify="center" h="40px">
                  <UserButton afterSignOutUrl="/" />
                </Flex>

                <IconButton
                  variant="ghost"
                  aria-label="Toggle Theme"
                  onClick={toggleColorMode}
                  style={{ borderRadius: "9999px" }}
                  color={{ base: "gray.700", _dark: "gray.100" }}
                >
                  {colorMode === "light" ? (
                    <LuMoon size={20} />
                  ) : (
                    <LuSun size={20} />
                  )}
                </IconButton>
              </HStack>
            </SignedIn>

            <SignedOut>
              <HStack
                gap={3}
                display={{ base: "none", md: "flex" }}
                align="center"
              >
                <SignInButton mode="modal">
                  <Button
                    variant="ghost"
                    size="sm"
                    color={{ base: "gray.700", _dark: "gray.100" }}
                  >
                    Đăng nhập
                  </Button>
                </SignInButton>
                <SignInButton mode="modal">
                  <Button
                    bg="#E65C00"
                    color="white"
                    size="sm"
                    _hover={{ bg: "#CC5200" }}
                  >
                    Đăng ký
                  </Button>
                </SignInButton>
                <IconButton
                  variant="ghost"
                  aria-label="Toggle Theme"
                  onClick={toggleColorMode}
                  style={{ borderRadius: "9999px" }}
                  color={{ base: "gray.700", _dark: "gray.100" }}
                >
                  {colorMode === "light" ? (
                    <LuMoon size={20} />
                  ) : (
                    <LuSun size={20} />
                  )}
                </IconButton>
              </HStack>
            </SignedOut>

            <Box display={{ base: "block", md: "none" }}>
              <Drawer.Root
                open={isDrawerOpen}
                onOpenChange={(e) => setIsDrawerOpen(e.open)} // Đồng bộ trạng thái đóng mở của Chakra v3
                alternativeTrigger={true}
              >
                <Drawer.Trigger asChild>
                  <IconButton
                    variant="ghost"
                    aria-label="Open Menu"
                    color={{ base: "gray.700", _dark: "gray.100" }}
                  >
                    <LuMenu size={24} />
                  </IconButton>
                </Drawer.Trigger>
                <Drawer.Positioner>
                  <Drawer.Content bg={{ base: "white", _dark: "gray.955" }}>
                    <Drawer.Body px={4} py={6}>
                      <Flex direction="column" gap={4} h="full">
                        <VStack align="stretch" gap={1}>
                          {navLinks.map((link, index) => (
                            <Link
                              key={index}
                              as={RouterLink}
                              to={link.href}
                              fontSize="md"
                              fontWeight="600"
                              color={{ base: "gray.800", _dark: "gray.100" }}
                              py={3}
                              borderBottom="1px solid"
                              borderColor={{
                                base: "gray.100",
                                _dark: "whiteAlpha.200",
                              }}
                            >
                              {link.label}
                            </Link>
                          ))}
                        </VStack>

                        <Box pt={2} mt="auto">
                          <SignedIn>
                            <Flex direction="column" gap={4}>
                              <Menu.Root>
                                <Menu.Trigger asChild>
                                  <Button
                                    variant="outline"
                                    size="md"
                                    w="full"
                                    display="flex"
                                    justifyContent="space-between"
                                    borderColor={{
                                      base: "gray.200",
                                      _dark: "whiteAlpha.200",
                                    }}
                                    color={{
                                      base: "gray.800",
                                      _dark: "gray.100",
                                    }}
                                  >
                                    <Text fontWeight="500">
                                      Quản lý tin đăng
                                    </Text>
                                    <LuChevronDown size={16} />
                                  </Button>
                                </Menu.Trigger>
                                <Portal>
                                  <Menu.Positioner>
                                    <Menu.Content
                                      bg={{ base: "white", _dark: "gray.900" }}
                                      borderColor={{
                                        base: "gray.200",
                                        _dark: "whiteAlpha.200",
                                      }}
                                    >
                                      <Menu.Item
                                        value="create"
                                        as={RouterLink}
                                        to="/create-property"
                                      >
                                        Đăng tin mới
                                      </Menu.Item>
                                      <Menu.Item
                                        value="manage"
                                        as={RouterLink}
                                        to="/manage-properties"
                                      >
                                        Tin của tôi
                                      </Menu.Item>
                                      <Menu.Item
                                        value="favorites"
                                        as={RouterLink}
                                        to="/favorites"
                                      >
                                        Tin yêu thích
                                      </Menu.Item>
                                    </Menu.Content>
                                  </Menu.Positioner>
                                </Portal>
                              </Menu.Root>

                              <Box
                                borderWidth="1px"
                                borderColor={{
                                  base: "gray.100",
                                  _dark: "whiteAlpha.200",
                                }}
                                borderRadius="xl"
                                bg={{ base: "gray.50/50", _dark: "gray.900" }}
                                overflow="hidden"
                              >
                                <Flex
                                  justify="space-between"
                                  align="center"
                                  p={3}
                                  bg={{
                                    base: "gray.100/70",
                                    _dark: "gray.800",
                                  }}
                                  cursor="pointer"
                                  onClick={() =>
                                    setShowMobileNoti(!showMobileNoti)
                                  }
                                >
                                  <HStack gap={2}>
                                    <LuBell size={18} />
                                    <Text
                                      fontWeight="600"
                                      fontSize="sm"
                                      color={{
                                        base: "gray.800",
                                        _dark: "gray.100",
                                      }}
                                    >
                                      Thông báo của bạn
                                    </Text>
                                    {unreadCount > 0 && (
                                      <Badge
                                        bg="#E65C00"
                                        color="white"
                                        borderRadius="full"
                                        fontSize="10px"
                                        px={2}
                                      >
                                        {unreadCount} mới
                                      </Badge>
                                    )}
                                  </HStack>
                                  <LuChevronDown
                                    size={16}
                                    style={{
                                      transform: showMobileNoti
                                        ? "rotate(180deg)"
                                        : "none",
                                      transition: "transform 0.2s",
                                    }}
                                  />
                                </Flex>

                                {showMobileNoti && (
                                  <Box
                                    bg={{ base: "white", _dark: "gray.955" }}
                                    maxH="260px"
                                    overflowY="auto"
                                  >
                                    {unreadCount > 0 && (
                                      <Flex
                                        justify="flex-end"
                                        p={2}
                                        borderBottomWidth="1px"
                                        borderColor={{
                                          base: "gray.50",
                                          _dark: "whiteAlpha.200",
                                        }}
                                      >
                                        <Button
                                          size="xs"
                                          variant="ghost"
                                          colorPalette="orange"
                                          onClick={handleMarkAllAsRead}
                                        >
                                          Đánh dấu đọc tất cả
                                        </Button>
                                      </Flex>
                                    )}

                                    {notifications.length === 0 ? (
                                      <Flex
                                        direction="column"
                                        align="center"
                                        gap={1}
                                        py={6}
                                        color={{
                                          base: "gray.400",
                                          _dark: "gray.500",
                                        }}
                                      >
                                        <LuBellOff size={20} />
                                        <Text fontSize="xs">
                                          Không có thông báo nào
                                        </Text>
                                      </Flex>
                                    ) : (
                                      notifications.map((noti) => (
                                        <Box
                                          key={noti._id}
                                          p={3}
                                          borderBottomWidth="1px"
                                          borderColor={{
                                            base: "gray.50",
                                            _dark: "whiteAlpha.200",
                                          }}
                                          bg={
                                            noti.isRead
                                              ? "transparent"
                                              : {
                                                  base: "orange.50",
                                                  _dark: "orange.950",
                                                }
                                          }
                                          as={RouterLink}
                                          to={`/properties/${noti.propertyId}`}
                                          display="block"
                                        >
                                          <Text
                                            fontWeight={
                                              noti.isRead ? "medium" : "bold"
                                            }
                                            fontSize="xs"
                                            color={{
                                              base: "gray.800",
                                              _dark: "gray.100",
                                            }}
                                            noOfLines={1}
                                          >
                                            {noti.title}
                                          </Text>
                                          <Text
                                            fontSize="11px"
                                            color={{
                                              base: "gray.600",
                                              _dark: "gray.300",
                                            }}
                                            mt={0.5}
                                            noOfLines={2}
                                          >
                                            {noti.message}
                                          </Text>
                                          <Text
                                            fontSize="9px"
                                            color={{
                                              base: "gray.400",
                                              _dark: "gray.500",
                                            }}
                                            mt={1}
                                          >
                                            {new Date(
                                              noti.createdAt,
                                            ).toLocaleString("vi-VN")}
                                          </Text>
                                        </Box>
                                      ))
                                    )}
                                  </Box>
                                )}
                              </Box>

                              <HStack
                                justify="space-between"
                                p={3}
                                bg={{ base: "gray.50", _dark: "gray.900" }}
                                rounded="xl"
                                borderWidth="1px"
                                borderColor={{
                                  base: "gray.100",
                                  _dark: "whiteAlpha.200",
                                }}
                              >
                                <HStack gap={2}>
                                  <IconButton
                                    variant="ghost"
                                    aria-label="Toggle Theme"
                                    onClick={toggleColorMode}
                                    style={{ borderRadius: "9999px" }}
                                    color={{
                                      base: "gray.700",
                                      _dark: "gray.100",
                                    }}
                                    size="sm"
                                  >
                                    {colorMode === "light" ? (
                                      <LuMoon size={18} />
                                    ) : (
                                      <LuSun size={18} />
                                    )}
                                  </IconButton>
                                  <Text
                                    fontWeight="600"
                                    fontSize="sm"
                                    color={{
                                      base: "gray.700",
                                      _dark: "gray.100",
                                    }}
                                  >
                                    Giao diện
                                  </Text>
                                </HStack>
                                <UserButton afterSignOutUrl="/" />
                              </HStack>
                            </Flex>
                          </SignedIn>

                          <SignedOut>
                            <Flex direction="column" gap={2}>
                              <HStack justify="space-between" mb={2} px={1}>
                                <Text fontSize="sm" color="fg.muted">
                                  Chuyển chế độ màu:
                                </Text>
                                <IconButton
                                  variant="ghost"
                                  aria-label="Toggle Theme"
                                  onClick={toggleColorMode}
                                  style={{ borderRadius: "9999px" }}
                                  color={{
                                    base: "gray.700",
                                    _dark: "gray.100",
                                  }}
                                  size="sm"
                                >
                                  {colorMode === "light" ? (
                                    <LuMoon size={18} />
                                  ) : (
                                    <LuSun size={18} />
                                  )}
                                </IconButton>
                              </HStack>
                              <SignInButton mode="modal">
                                <Button
                                  bg="#E65C00"
                                  color="white"
                                  w="full"
                                  size="md"
                                  _hover={{ bg: "#CC5200" }}
                                >
                                  Đăng nhập / Đăng ký
                                </Button>
                              </SignInButton>
                            </Flex>
                          </SignedOut>
                        </Box>
                      </Flex>
                    </Drawer.Body>
                  </Drawer.Content>
                </Drawer.Positioner>
              </Drawer.Root>
            </Box>
          </HStack>
        </Flex>
      </Container>
    </Box>
  );
};

export default Navbar;
